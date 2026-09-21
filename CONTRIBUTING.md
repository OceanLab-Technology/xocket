# Contributing to Xocket

Thanks for taking the time. This doc covers how to get set up, what the
project expects of a change, and where things live.

## Getting started

```bash
git clone https://github.com/OceanLab-Technology/xocket.git
cd xocket
pnpm install
pnpm build
pnpm test
```

You need Node >= 20.19 and pnpm 10+. Some CI jobs also need Go, Rust or uv,
but you only need those if you are touching the matching service generator.

Run the CLI from source:

```bash
node dist/index.js create /tmp/demo --yes --no-git
```

## The one thing to understand first

Xocket is a code generator. **The output is the product** — the CLI passing its
own tests means nothing if the project it produces cannot run `lint`,
`type-check` and `build`. That happened: every one of those failed in the 2.0.0
release, which is why the test suite and the CI matrix look the way they do.

So: if you change a generator, prove the generated project still works.

```bash
pnpm build
node dist/index.js create /tmp/demo --yes --no-git
cd /tmp/demo && pnpm lint && pnpm type-check && pnpm build && pnpm test
```

## Where things live

| Path              | Role                                               |
| ----------------- | -------------------------------------------------- |
| `src/index.ts`    | Commander entry point; every flag is declared here |
| `src/schema.ts`   | All user-facing choices, as zod schemas            |
| `src/versions.ts` | Every dependency version Xocket emits              |
| `src/ui/`         | Terminal styling: theme, banner, progress, summary |
| `src/cli/`        | Commands, prompts, config derivation               |
| `src/generators/` | One module per concern                             |
| `templates/`      | Copied verbatim, then patched by generators        |
| `tests/`          | Vitest                                             |

`CLAUDE.md` has the longer version, including the invariants that exist because
a specific bug shipped.

## Rules worth knowing before you start

Each of these encodes a real bug. There is a test for every one, and
`xocket doctor` detects each in an existing project.

1. **Dependency versions go in `src/versions.ts`.** Never inline a range in a
   generator — a stack refresh should be a one-file diff.
2. **`include` / `exclude` / `paths` belong in the app's tsconfig, never in the
   shared package.** TypeScript resolves relative paths against the file that
   declares them.
3. **An `exports` map must list every specifier apps actually import**, with and
   without the `.js` suffix.
4. **Anything the generated root's scripts or hooks invoke must be a root
   dependency.** pnpm does not hoist an app's dependency to the root.
5. **Use `envConvention(config)` for public env vars.** `target` wins over
   `framework` — Expo is not a web target.
6. **When you replace a template file with a different extension, delete the
   original.**
7. **If the summary prints "✓ X", X must actually work.**

## Adding a stack option

1. Add the value to the relevant enum in `src/schema.ts`.
2. Add any new dependency ranges to `src/versions.ts`.
3. Handle it in the generator(s).
4. The flag choices read from the enum, so `src/index.ts` is usually free.
5. Extend the CI matrix in `.github/workflows/ci.yml`.

## Adding an `add` module

1. Add the name to `MODULES` in `src/schema.ts`.
2. Write `src/generators/<module>.ts`.
3. Add a `case` in `src/cli/commands/add.ts`.
4. Add a `case` in `src/cli/commands/apply-modules.ts` so presets can request
   it. Mind `moduleRank` — `docker` reads the manifest, so it runs last.
5. Record it in the manifest so `doctor` and later modules can see it.

## Tests

```bash
pnpm test           # unit + generator assertions, no installs
pnpm test:watch
```

Generator tests write real trees to a temp dir and assert on the output. They
do not run `pnpm install` — anything needing a real install or toolchain goes
in CI.

A bug fix should come with a test that fails without it. If the bug would show
up in an existing project, add a check to `xocket doctor` too.

## Commits and PRs

Conventional commits (`fix:`, `feat:`, `docs:`, `ci:`, `chore:`). The body
matters more than the subject — say what broke and why the fix is the right
one, not just what you changed.

PRs run the full matrix: every framework × state × backend combination, plus
Expo, each backend language, each module, and a full-stack preset. It takes a
while. Keep it green.

## Releasing

Maintainers only. Bump the version in `package.json`, update `CHANGELOG.md`,
then tag:

```bash
git tag v3.0.1 && git push origin v3.0.1
```

The release workflow builds, tests, and publishes to npm with provenance.

## Questions

Open a [discussion](https://github.com/OceanLab-Technology/xocket/discussions)
or an issue. For anything security-related, see [SECURITY.md](SECURITY.md).
