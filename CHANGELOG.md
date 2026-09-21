# Changelog

## 3.0.0

### Fixed — the generated project did not work

A project created by 2.0.0 could not run `lint`, `type-check`, `build` or
`format`; each failed for a different reason. All of these now have a
regression test, and `xocket doctor` detects each one in an existing project.

- **Shared tsconfig owned `include`/`baseUrl`/`paths`.** TypeScript resolves
  relative paths against the file that declares them, so `include: ["src"]`
  resolved to `packages/typescript-config/src` and `tsc` reported TS18003 in
  every app. Moved into each app's own tsconfig; `baseUrl` dropped (removed in
  TypeScript 7).
- **`eslint-config` exported `./react` while apps imported `./react.js`**, so
  every lint run died with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- **The lint script used `--ext`**, removed in ESLint 9.
- **`tailwind.config.js` contained a top-level `await import()`.** Tailwind's
  config loader transpiles to CJS and threw `Unexpected identifier 'Promise'`,
  so no CSS was produced at all.
- **shadcn declared `cssVariables: true` but nothing wrote them**, so
  `bg-background` and `text-muted-foreground` — used by the starter page —
  resolved to nothing and the first screen rendered unstyled.
- **Sentry wrote `next.config.ts` but left the template's `next.config.js`.**
  Next 14 could not read a `.ts` config, loaded the empty `.js` one, and
  silently dropped Sentry while the summary still printed "✓ Sentry".
- **The root lacked `eslint` and `@xocket/prettier-config`**, which its own
  `.prettierrc` and pre-commit hook both invoked — so `pnpm format` and every
  commit hook failed.
- **`prettier-config` shipped `export default` without `"type": "module"`.**
- **The Expo app inherited the web app's env convention**, reading
  `NEXT_PUBLIC_*` or `import.meta.env` — neither exists under Metro.
- **The Expo app had a lint script but no ESLint config**, failing `turbo lint`;
  it also had no `.env` files, and `app.json` referenced assets never shipped.
- A freshly generated project failed its own `format:check`.

### Changed — stack refresh

React 19, Next 16, Tailwind v4 (CSS-first), Expo 57, Sentry v10 instrumentation
hooks, Vite 8, Turborepo 2.11, Commander 15. Every version now lives in
`src/versions.ts`.

ESLint stays on the 9.x line: `eslint-plugin-react` peers on `^9.7` and crashes
on 10.

### Added

- **Non-interactive flags** — `--yes`, `-f/-s/-b`, `--template`, `--no-install`,
  `--no-git`. Required for CI, scripts and coding agents.
- **zod validation** of prompt answers, CLI flags, presets and the on-disk
  manifest, through one set of schemas.
- **`xocket doctor`** — checks an existing project against the current
  generator, reports drift and known breakage with a fix for each, and exits
  non-zero on errors.
- **`xocket add db`** — Drizzle or Prisma in `packages/db`, shared workspace-wide.
- **`xocket add auth-ui`** — sign-in / sign-up screens wired to the project's
  actual backend, with route protection on Next.
- **`xocket add agent`** — an MCP server exposing the project to assistants.
- **`xocket add backend --lang node|go|rust|python`** — polyglot services under
  `services/*`, joined to the Turborepo graph via `package.json` shims.
- **`xocket add docker`** — per-language multi-stage Dockerfiles (none running
  as root), Compose derived from the manifest, and Kubernetes manifests.
- **`xocket add seo`, `--seo`, `--ai-seo`** — sitemap, robots, generated OG
  image, JSON-LD builders, `llms.txt` and an AI-crawler allowlist.
- **Org presets** via `--template`, local or over https, with
  flag → preset → prompt → default precedence.
- **`packages/ui`** — shared components and the design-token layer, so apps
  cannot drift apart.
- **Vitest + Testing Library** in every generated app, with a passing test.
- **Generated CI** — a GitHub Actions workflow and grouped Dependabot config.
- **Preflight checks** for Node, pnpm and git before any file is written.
- **Terminal UI** — gradient banner, numbered phase progress, aligned summary,
  colourised help; all of it degrades off a TTY and under `NO_COLOR`.

### Removed

- `package-lock.json` (pnpm only) and the dead `src/cli/run.ts`.
- The CLI version is read from `package.json` rather than hardcoded in five
  places.

### Breaking

- Generated projects require Node >= 20.19.
- The generated stack moves to React 19 / Next 16 / Tailwind v4, none of which
  are drop-in from the 2.x output. For an existing project, run
  `xocket doctor` to see what needs attention.

## 2.0.0

Initial public release.
