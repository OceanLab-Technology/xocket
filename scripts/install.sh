#!/bin/sh
# Xocket installer — https://github.com/OceanLab-Technology/xocket
#
#   curl -fsSL https://get.xocket.sh | sh
#
# Options, as environment variables:
#   XOCKET_VERSION=3.0.0   install a specific version (default: latest)
#   XOCKET_INSTALL=~/.xocket  where to unpack (default: ~/.local/share/xocket)
#   XOCKET_BIN=~/.local/bin   where to link the executable
#
# Uninstall:
#   rm -rf ~/.local/share/xocket ~/.local/bin/xocket
#
# POSIX sh on purpose: this has to run under dash and busybox ash, not just bash.

set -eu

REPO="OceanLab-Technology/xocket"
INSTALL_DIR="${XOCKET_INSTALL:-${HOME}/.local/share/xocket}"
BIN_DIR="${XOCKET_BIN:-${HOME}/.local/bin}"
MIN_NODE_MAJOR=20

# ── Output ───────────────────────────────────────────────────────────────────

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  B="$(printf '\033[1m')"; D="$(printf '\033[2m')"; R="$(printf '\033[0m')"
  GREEN="$(printf '\033[32m')"; RED="$(printf '\033[31m')"; YELLOW="$(printf '\033[33m')"
  CYAN="$(printf '\033[36m')"
else
  B=""; D=""; R=""; GREEN=""; RED=""; YELLOW=""; CYAN=""
fi

info() { printf '%s\n' "$1"; }
step() { printf '%s▸%s %s\n' "$CYAN" "$R" "$1"; }
warn() { printf '%s!%s %s\n' "$YELLOW" "$R" "$1" >&2; }
die()  { printf '%serror%s %s\n' "$RED" "$R" "$1" >&2; exit 1; }

# ── Preconditions ────────────────────────────────────────────────────────────

need() { command -v "$1" >/dev/null 2>&1 || die "$1 is required but was not found."; }

need tar
need mkdir

if command -v curl >/dev/null 2>&1; then
  fetch() { curl -fsSL "$1" -o "$2"; }
  fetch_stdout() { curl -fsSL "$1"; }
elif command -v wget >/dev/null 2>&1; then
  fetch() { wget -qO "$2" "$1"; }
  fetch_stdout() { wget -qO- "$1"; }
else
  die "Either curl or wget is required."
fi

# Xocket runs on Node and drives pnpm; so does every project it generates.
# Checking here turns a confusing runtime crash into a clear message.
if ! command -v node >/dev/null 2>&1; then
  die "Node is required but was not found.
      Xocket runs on Node, and so does every project it generates.
      Install Node ${MIN_NODE_MAJOR}+ from https://nodejs.org or via nvm, then re-run this."
fi

NODE_VERSION="$(node -v 2>/dev/null | sed 's/^v//')"
NODE_MAJOR="${NODE_VERSION%%.*}"
if [ "$NODE_MAJOR" -lt "$MIN_NODE_MAJOR" ] 2>/dev/null; then
  die "Node ${NODE_VERSION} is too old — Xocket needs ${MIN_NODE_MAJOR}+."
fi

if ! command -v pnpm >/dev/null 2>&1; then
  warn "pnpm was not found. Xocket uses it to install dependencies."
  warn "Install it with:  npm install -g pnpm"
fi

# ── Resolve the version ──────────────────────────────────────────────────────

VERSION="${XOCKET_VERSION:-}"
if [ -z "$VERSION" ]; then
  step "Looking up the latest release"
  VERSION="$(
    fetch_stdout "https://api.github.com/repos/${REPO}/releases/latest" \
      | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"v\{0,1\}\([^"]*\)".*/\1/p' \
      | head -n 1
  )" || true
  [ -n "$VERSION" ] || die "Could not determine the latest version. Set XOCKET_VERSION and retry."
fi
VERSION="${VERSION#v}"

TARBALL="xocket-${VERSION}.tar.gz"
BASE="https://github.com/${REPO}/releases/download/v${VERSION}"

# ── Download and verify ──────────────────────────────────────────────────────

TMP="$(mktemp -d 2>/dev/null || mktemp -d -t xocket)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT INT TERM

step "Downloading xocket ${VERSION}"
fetch "${BASE}/${TARBALL}" "${TMP}/${TARBALL}" \
  || die "Download failed. Does https://github.com/${REPO}/releases/tag/v${VERSION} exist?"

# Checksums are published alongside the tarball; verify when we can.
if fetch "${BASE}/${TARBALL}.sha256" "${TMP}/${TARBALL}.sha256" 2>/dev/null; then
  EXPECTED="$(cut -d' ' -f1 < "${TMP}/${TARBALL}.sha256")"
  if command -v sha256sum >/dev/null 2>&1; then
    ACTUAL="$(sha256sum "${TMP}/${TARBALL}" | cut -d' ' -f1)"
  elif command -v shasum >/dev/null 2>&1; then
    ACTUAL="$(shasum -a 256 "${TMP}/${TARBALL}" | cut -d' ' -f1)"
  else
    ACTUAL=""
    warn "No sha256 tool found; skipping checksum verification."
  fi
  if [ -n "$ACTUAL" ] && [ "$ACTUAL" != "$EXPECTED" ]; then
    die "Checksum mismatch.
      expected ${EXPECTED}
      actual   ${ACTUAL}
      Refusing to install."
  fi
else
  warn "No published checksum for this release; skipping verification."
fi

# ── Install ──────────────────────────────────────────────────────────────────

step "Installing to ${INSTALL_DIR}"
tar -xzf "${TMP}/${TARBALL}" -C "$TMP"
[ -d "${TMP}/xocket" ] || die "The archive did not contain the expected layout."

# Replace atomically-ish: stage the new one, swap, then drop the old.
rm -rf "${INSTALL_DIR}.old"
if [ -d "$INSTALL_DIR" ]; then
  mv "$INSTALL_DIR" "${INSTALL_DIR}.old"
fi
mkdir -p "$(dirname "$INSTALL_DIR")"
mv "${TMP}/xocket" "$INSTALL_DIR"
rm -rf "${INSTALL_DIR}.old"

chmod +x "${INSTALL_DIR}/bin/xocket"

mkdir -p "$BIN_DIR"
ln -sf "${INSTALL_DIR}/bin/xocket" "${BIN_DIR}/xocket"

# ── PATH ─────────────────────────────────────────────────────────────────────

printf '\n%s✓%s xocket %s installed\n\n' "$GREEN" "$R" "$VERSION"

case ":${PATH}:" in
  *":${BIN_DIR}:"*)
    printf '  %sxocket create my-app%s\n\n' "$CYAN" "$R"
    ;;
  *)
    warn "${BIN_DIR} is not on your PATH."
    # These are filenames we print for the reader, not paths we open, so the
    # tilde stays literal on purpose.
    # shellcheck disable=SC2088
    case "${SHELL##*/}" in
      zsh)  RC="~/.zshrc" ;;
      bash) RC="~/.bashrc" ;;
      fish) RC="~/.config/fish/config.fish" ;;
      *)    RC="your shell profile" ;;
    esac
    printf '\n  Add it by appending this to %s%s%s:\n\n' "$B" "$RC" "$R"
    if [ "${SHELL##*/}" = "fish" ]; then
      printf '    %sfish_add_path %s%s\n\n' "$CYAN" "$BIN_DIR" "$R"
    else
      # $PATH must survive verbatim — this is the line the user will paste.
      # shellcheck disable=SC2016
      printf '    %sexport PATH="%s:$PATH"%s\n\n' "$CYAN" "$BIN_DIR" "$R"
    fi
    printf '  Then restart your shell and run:  %sxocket create my-app%s\n\n' "$CYAN" "$R"
    ;;
esac

printf '%sDocs:%s https://github.com/%s\n' "$D" "$R" "$REPO"
