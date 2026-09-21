# xocket — contributor notes

A Node CLI (TypeScript, ESM) that scaffolds pnpm + Turborepo monorepos.

## Layout

| Path | Role |
|---|---|
| `src/index.ts` | Commander entry point; every flag is declared here |
| `src/schema.ts` | **All** user-facing choices, as zod schemas. Prompts, flags, presets and the on-disk manifest validate against these |
| `src/versions.ts` | **Every** dependency version Xocket emits. Never inline a range in a generator |
| `src/version.ts` | CLI version, read from package.json — do not hardcode it |
| `src/ui/` | Terminal styling: theme, banner, stepped progress, summary blocks |
| `src/cli/` | Commands (`create`, `add`, `doctor`), prompts, config derivation |
| `src/generators/` | One module per concern; each takes a `Config` and writes files |
| `src/utils/env.ts` | Public-env conventions per target (`VITE_` / `NEXT_PUBLIC_` / `EXPO_PUBLIC_`) |
| `src/utils/preset.ts` | Org preset loading and validation |
| `templates/` | Files copied verbatim, then patched by generators |
| `tests/` | Vitest; `generators.test.ts` pins previously-shipped bugs |

## Rules that exist for a reason

Each encodes a bug that shipped in 2.0.0. There is a test for every one, and
`xocket doctor` detects each in an existing project.

1. **Versions go in `src/versions.ts`.** A stack refresh should be a one-file diff.
2. **`include` / `exclude` / `paths` belong in the app's tsconfig, never the shared
   package.** TypeScript resolves relative paths against the file that declares
   them, so putting them in `packages/typescript-config` made `tsc` report
   TS18003 in every generated app. No `baseUrl` — removed in TypeScript 7.
3. **An `exports` map must list every specifier apps actually import**, with and
   without the `.js` suffix.
4. **Anything the root's own scripts or hooks invoke must be a root
   dependency.** lint-staged runs `eslint`; `.prettierrc` resolves
   `@xocket/prettier-config`.
5. **Use `envConvention(config)` for public env vars.** Branching on `framework`
   alone sent Expo `NEXT_PUBLIC_*`, which does not exist under Metro. `target`
   wins over `framework`.
6. **Deriving a config for another app goes through `deriveAppConfig`**, which
   recomputes `isNext`/`isReact` alongside `framework`.
7. **When you replace a template file with a different extension, delete the
   original.** Writing `next.config.ts` while leaving `next.config.js` meant Next
   loaded the empty one and silently dropped Sentry.
8. **If the summary prints "✓ X", X must actually work.**

## Terminal output

`src/ui/theme.ts` owns the palette; call sites use the semantic helpers (`t.value`,
`t.muted`, `t.error`) rather than picocolors directly, so a palette change is one
edit. Everything degrades: `gradient()` falls back to plain cyan without
truecolor, the banner collapses to one line off a TTY, and `Steps` prints linear
lines instead of spinners. Never assume stdout is a terminal.

## Testing

```bash
pnpm test           # fast: unit + generator assertions, no installs
pnpm build && node dist/index.js create /tmp/demo --yes --no-git
```

Generator tests write real trees to a temp dir and assert on the output; they do
not run `pnpm install`. Anything needing a real install or toolchain belongs in
CI (`.github/workflows/ci.yml`), which scaffolds the full matrix plus Expo, each
backend language, each optional module, and a full-stack preset.

## Adding a stack option

1. Add the value to the relevant enum in `src/schema.ts`.
2. Add any new dependency ranges to `src/versions.ts`.
3. Handle it in the generator(s).
4. Add the flag choice in `src/index.ts` (it reads the enum, so usually free).
5. Extend the CI matrix in `.github/workflows/ci.yml`.

## Adding an `add` module

1. Add the name to `MODULES` in `src/schema.ts`.
2. Write `src/generators/<module>.ts` (or a directory for a larger one).
3. Add a `case` in `src/cli/commands/add.ts`.
4. Add a `case` in `src/cli/commands/apply-modules.ts` so presets can request it.
   Mind `moduleRank` — `docker` reads the manifest, so it must run last.
5. Record it in the manifest so `doctor` and later modules can see it.
