# Security Policy

## Supported versions

| Version | Supported                                                               |
| ------- | ----------------------------------------------------------------------- |
| 3.x     | ✅                                                                      |
| 2.x     | ❌ — contains bugs that make generated projects non-functional; upgrade |

## Reporting a vulnerability

**Do not open a public issue.**

Report privately through
[GitHub Security Advisories](https://github.com/OceanLab-Technology/xocket/security/advisories/new),
or email **security@oceanlab.in**.

Please include what you can: affected version, reproduction steps, and what an
attacker could achieve. We will acknowledge within 3 working days and aim to
ship a fix or a mitigation plan within 14 days.

## What is in scope

Xocket is a code generator, so the interesting surface is what it writes and
what it executes:

- **Generated code that is insecure by default** — for example a secret placed
  where a bundler would ship it to the browser, or an auth check that does not
  hold.
- **Org presets (`--template`)**, which come from a URL and control what gets
  written to disk.
- **Command execution** — the CLI shells out to `pnpm`, `git` and `prettier`.
- **Supply chain** — the dependency ranges in `src/versions.ts`.

## Deliberate design decisions

These are intentional, not vulnerabilities:

- **Presets load over `https` only.** Plain HTTP is refused, because a preset
  determines what is written to disk.
- **Generated `.env.development` / `.staging` / `.production` files contain
  placeholders and are gitignored.** Only `.env.example` is committed.
- **`SUPABASE_SERVICE_ROLE_KEY` and `SENTRY_AUTH_TOKEN` are never given a
  `NEXT_PUBLIC_` prefix**, and the generated admin client carries a warning
  against importing it from client code.
- **Generated Dockerfiles run as a non-root user** and use multi-stage builds so
  no toolchain reaches the runtime image.
- **Generated Next.js middleware only checks that a session cookie exists.** It
  is a starting point; the generated code says so, and the session must still
  be verified server-side.

If you think one of those calls is wrong, that is worth raising — please do.
