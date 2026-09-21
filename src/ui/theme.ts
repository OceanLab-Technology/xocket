import pc from 'picocolors';

/**
 * Terminal styling for the CLI.
 *
 * Built on picocolors (which already honours NO_COLOR, FORCE_COLOR and
 * non-TTY stdout) plus a small truecolor layer for the brand gradient.
 * Everything degrades to plain text when colour is unavailable, so piped
 * output and CI logs stay readable.
 */

/** True when the terminal can render 24-bit colour. */
export const supportsTrueColor = (() => {
  if (!pc.isColorSupported) return false;
  const depth = process.env.COLORTERM ?? '';
  return depth.includes('truecolor') || depth.includes('24bit');
})();

export type Rgb = readonly [r: number, g: number, b: number];

/** Xocket's brand ramp — deep indigo through cyan. */
export const BRAND: readonly Rgb[] = [
  [99, 102, 241],
  [79, 128, 245],
  [56, 160, 240],
  [34, 197, 235],
  [34, 211, 220],
];

export function rgb(text: string, [r, g, b]: Rgb): string {
  if (!supportsTrueColor) return pc.cyan(text);
  return `\u001B[38;2;${r};${g};${b}m${text}\u001B[39m`;
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/** Sample the brand ramp at `t` ∈ [0, 1]. */
export function sampleBrand(t: number): Rgb {
  const clamped = Math.min(Math.max(t, 0), 1);
  const scaled = clamped * (BRAND.length - 1);
  const i = Math.min(Math.floor(scaled), BRAND.length - 2);
  const local = scaled - i;
  const from = BRAND[i]!;
  const to = BRAND[i + 1]!;
  return [lerp(from[0], to[0], local), lerp(from[1], to[1], local), lerp(from[2], to[2], local)];
}

/** Colour each character along the brand gradient. */
export function gradient(text: string): string {
  if (!supportsTrueColor) return pc.cyan(pc.bold(text));

  const chars = [...text];
  const last = Math.max(chars.length - 1, 1);
  return chars.map((ch, i) => (ch === ' ' ? ch : rgb(ch, sampleBrand(i / last)))).join('');
}

/** Apply the gradient line-by-line so multi-line art reads vertically. */
export function gradientBlock(block: string): string {
  const lines = block.split('\n');
  const last = Math.max(lines.length - 1, 1);
  return lines
    .map((line, i) => (supportsTrueColor ? rgb(line, sampleBrand(i / last)) : pc.cyan(line)))
    .join('\n');
}

// ── Semantic roles ──────────────────────────────────────────────────────────
// Naming these by meaning rather than colour keeps call sites readable and
// makes a palette change a one-file edit.

export const t = {
  brand: (s: string) => rgb(s, BRAND[2]!),
  heading: (s: string) => pc.bold(s),
  value: (s: string) => pc.cyan(s),
  muted: (s: string) => pc.dim(s),
  success: (s: string) => pc.green(s),
  warn: (s: string) => pc.yellow(s),
  error: (s: string) => pc.red(s),
  code: (s: string) => pc.cyan(s),
  /** For a path, URL or filename the user may want to copy. */
  path: (s: string) => pc.underline(pc.cyan(s)),
};

/** Glyphs, with ASCII fallbacks for terminals that cannot render them. */
const unicode = process.platform !== 'win32' || Boolean(process.env.WT_SESSION);

export const glyph = {
  tick: unicode ? '✓' : 'v',
  cross: unicode ? '✗' : 'x',
  arrow: unicode ? '→' : '->',
  dot: unicode ? '·' : '-',
  bullet: unicode ? '◆' : '*',
  line: unicode ? '─' : '-',
  sparkle: unicode ? '✦' : '*',
  warn: unicode ? '▲' : '!',
};

/** A full-width rule, sized to the terminal but capped for readability. */
export function rule(width = Math.min(process.stdout.columns ?? 72, 72)): string {
  return pc.dim(glyph.line.repeat(width));
}
