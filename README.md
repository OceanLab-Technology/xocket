# xocket

> Monorepo Development Platform CLI

Scaffolds production-ready TypeScript monorepos on **pnpm workspaces** + **Turborepo** — web, mobile, polyglot backend services, and SEO.

```bash
npx xocket create my-project
```

## Quick start

```bash
# Interactive
npx xocket create my-project

# Non-interactive — every question has a flag
npx xocket create my-project --yes -f next -s zustand -b supabase --ai-seo

# Global install
npm install -g xocket
xocket create my-project
```

## What you get

| | |
|---|---|
| **Monorepo** | pnpm workspaces + Turborepo, shared `typescript-config` / `eslint-config` / `prettier-config` packages |
| **Web** | React 19 (Vite 8) or Next.js 16 App Router |
| **Styling** | Tailwind CSS v4 (CSS-first) + shadcn/ui with the full design-token layer wired up |
| **State** | Zustand · React Context · Redux Toolkit · none |
| **Server state** | TanStack Query v5 · none |
| **Backend / auth** | Supabase (SSR split on Next) · AWS Cognito (Amplify v6) · custom API · none |
| **Observability** | Sentry v10, via the `instrumentation` hooks |
| **Quality** | ESLint 9 flat config, Prettier, Husky, lint-staged |
| **Environments** | development · staging · production |

Optional, via prompt or flag:

- **SEO** — canonical URLs, Open Graph, generated OG image, `sitemap.xml`, `robots.txt`, schema.org JSON-LD builders
- **AEO** — `llms.txt` / `llms-full.txt`, an explicit AI-crawler allowlist, cache headers

## Commands

### `xocket create [name]`

| Flag | Values | Notes |
|---|---|---|
| `-f, --framework` | `react` \| `next` | |
| `-s, --state` | `zustand` \| `context` \| `redux` \| `none` | |
| `--server-state` | `tanstack` \| `none` | |
| `-b, --backend` | `supabase` \| `cognito` \| `custom` \| `none` | |
| `--seo` / `--no-seo` | | sitemap, robots, Open Graph, JSON-LD |
| `--ai-seo` / `--no-ai-seo` | | answer-engine optimisation; implies `--seo` |
| `-y, --yes` | | use defaults for anything not passed |
| `--no-install` | | skip `pnpm install` |
| `--no-git` | | skip `git init` and the initial commit |

Anything you pass as a flag is not prompted for. `--yes` answers the rest with
defaults, which is what makes the CLI usable from CI, scripts and coding agents.

### `xocket add <module>`

```bash
xocket add expo                              # Expo 57 app, mirroring the web stack
xocket add backend --lang go --name orders   # Go · Rust · Python · TypeScript service
xocket add seo                               # add SEO/AEO to an existing project
```

| Flag | Values |
|---|---|
| `-l, --lang` | `node` \| `go` \| `rust` \| `python` |
| `-n, --name` | service name (backend only) |
| `-y, --yes` | accept defaults |
| `--no-install` | skip `pnpm install` |

## Polyglot services

`xocket add backend` puts a service under `services/<name>` with a small
`package.json` whose scripts shell out to the native toolchain. Turborepo then
treats Go, Rust and Python exactly like a JS package — same `pnpm dev`, same
`pnpm build`, same caching.

| Language | Stack | Toolchain you need | Port |
|---|---|---|---|
| `node` | Hono + tsup | — | 3001 |
| `go` | net/http | Go 1.22+ | 3002 |
| `rust` | Axum + Tokio | Rust stable | 3003 |
| `python` | FastAPI + uv | uv | 3004 |

Each exposes `GET /health`.

## Generated layout

```
my-project/
├── apps/
│   ├── web/                 # React (Vite) or Next.js
│   └── expo/                # after `xocket add expo`
├── services/                # after `xocket add backend`
│   └── orders/
├── packages/
│   ├── typescript-config/
│   ├── eslint-config/
│   └── prettier-config/
├── turbo.json
├── pnpm-workspace.yaml
└── .xocket/config.json      # project manifest
```

## Requirements

- Node >= 20.19
- pnpm 9+ (`npm install -g pnpm`)
- git (optional — `--no-git` skips it)

`xocket create` checks for these before writing any files.

## Development

```bash
pnpm install
pnpm build
pnpm test          # unit + generator regression tests
pnpm dev -- create demo --yes    # run from source
```

CI scaffolds a real project for every framework × state × backend combination,
then runs `lint`, `type-check` and `build` against it — plus Expo and all four
backend languages. See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## License

MIT
