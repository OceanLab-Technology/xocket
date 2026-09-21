<h1 align="center">xocket</h1>

<p align="center">
  <strong>Monorepo Development Platform CLI</strong><br>
  Scaffold production-ready TypeScript monorepos — web, mobile, polyglot services, database, auth, containers and SEO.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/xocket"><img alt="npm" src="https://img.shields.io/npm/v/xocket?color=0b7285&label=npm"></a>
  <a href="https://github.com/OceanLab-Technology/xocket/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/OceanLab-Technology/xocket/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <a href="#requirements"><img alt="Node >= 20.19" src="https://img.shields.io/badge/node-%3E%3D20.19-5FA04E"></a>
  <a href="CONTRIBUTING.md"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen"></a>
</p>

```bash
npx xocket create my-project
```

## Quick start

```bash
# Interactive
npx xocket create my-project

# Non-interactive — every question has a flag
npx xocket create my-project --yes -f next -s zustand -b supabase --ai-seo

# From an org preset
npx xocket create my-project --template ./team-preset.json --yes
```

## What you get

|                    |                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Monorepo**       | pnpm workspaces + Turborepo; shared `typescript-config`, `eslint-config`, `prettier-config` and `ui` packages |
| **Web**            | React 19 (Vite 8) or Next.js 16 App Router                                                                    |
| **Styling**        | Tailwind CSS v4 (CSS-first) + shadcn/ui, design tokens wired up                                               |
| **State**          | Zustand · React Context · Redux Toolkit · none                                                                |
| **Server state**   | TanStack Query v5 · none                                                                                      |
| **Backend / auth** | Supabase (SSR split on Next) · AWS Cognito · custom API · none                                                |
| **Testing**        | Vitest + Testing Library, with a passing test from the first commit                                           |
| **Observability**  | Sentry v10 instrumentation hooks                                                                              |
| **Quality**        | ESLint 9 flat config, Prettier, Husky, lint-staged                                                            |
| **CI**             | a GitHub Actions workflow and grouped Dependabot config                                                       |

## Commands

### `xocket create [name]`

| Flag                        | Values                                              |
| --------------------------- | --------------------------------------------------- |
| `-f, --framework`           | `react` \| `next`                                   |
| `-s, --state`               | `zustand` \| `context` \| `redux` \| `none`         |
| `--server-state`            | `tanstack` \| `none`                                |
| `-b, --backend`             | `supabase` \| `cognito` \| `custom` \| `none`       |
| `--seo` / `--no-seo`        | sitemap, robots, Open Graph, JSON-LD                |
| `--ai-seo` / `--no-ai-seo`  | answer-engine optimisation; implies `--seo`         |
| `-t, --template <source>`   | org preset — a local `.json` path or an `https` URL |
| `-y, --yes`                 | use defaults for anything not passed                |
| `--no-install` / `--no-git` | skip install / git                                  |

Anything passed as a flag is not prompted for. `--yes` answers the rest with defaults, which is what makes the CLI usable from CI, scripts and coding agents.

### `xocket add <module>`

| Module    | What it adds                                              |
| --------- | --------------------------------------------------------- |
| `expo`    | Expo 57 app mirroring the web stack                       |
| `backend` | a service in TypeScript, Go, Rust or Python               |
| `db`      | Drizzle or Prisma in `packages/db`, shared workspace-wide |
| `auth-ui` | sign-in / sign-up screens wired to your backend           |
| `seo`     | sitemap, robots, Open Graph, JSON-LD, `llms.txt`          |
| `agent`   | an MCP server exposing this project to assistants         |
| `docker`  | Dockerfiles, Compose and Kubernetes manifests             |

```bash
xocket add expo
xocket add backend --lang go --name orders-api
xocket add db --orm drizzle
xocket add auth-ui
xocket add agent --name my-mcp
xocket add docker --target both
```

### `xocket doctor`

Checks an existing project against the current generator and reports what drifted, with a fix for each finding. Exits non-zero on errors, so it works in CI.

```
✗ error  Shared tsconfig declares include/baseUrl/paths
        TypeScript resolves those against packages/typescript-config, not your
        app, so `tsc` finds no files (TS18003).
        fix: Move include/exclude/paths into apps/*/tsconfig.json.
```

## Polyglot services

`xocket add backend` puts a service under `services/<name>` with a small `package.json` whose scripts shell out to the native toolchain. Turborepo then treats Go, Rust and Python exactly like a JS package — same `pnpm dev`, same `pnpm build`, same caching.

| Language | Stack        | Needs       | Port |
| -------- | ------------ | ----------- | ---- |
| `node`   | Hono + tsup  | —           | 3001 |
| `go`     | net/http     | Go 1.22+    | 3002 |
| `rust`   | Axum + Tokio | Rust stable | 3003 |
| `python` | FastAPI + uv | uv          | 3004 |

Each exposes `GET /health`.

## Org presets

A preset pins the choices your team always makes, so nobody answers the same six questions again. Every field is optional.

```json
{
  "name": "OceanLab standard",
  "framework": "next",
  "backend": "supabase",
  "seo": true,
  "aiSeo": true,
  "modules": [
    { "module": "db", "orm": "drizzle" },
    { "module": "backend", "lang": "go", "name": "orders-api" },
    "auth-ui",
    { "module": "docker", "target": "both" }
  ]
}
```

```bash
xocket create my-app --template ./oceanlab.json --yes
xocket create my-app --template https://example.com/preset.json --yes
```

Precedence is **flag → preset → prompt → default**. Presets load over `https` only.

## SEO and AEO

`--seo` generates `src/lib/seo.ts` — one file holding site name, description, canonical URL and social handles — plus JSON-LD builders (`organizationJsonLd`, `websiteJsonLd`, `breadcrumbsJsonLd`, `articleJsonLd`, `faqJsonLd`).

On Next.js that drives `robots.ts`, `sitemap.ts`, a build-time `opengraph-image.tsx`, and the root layout's metadata.

`--ai-seo` adds answer-engine optimisation on top: `llms.txt`, `llms-full.txt`, cache headers, and an explicit allowlist for GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended and others.

> **On a Vite SPA, `--seo` can only do so much.** Metadata applied in the browser is invisible to crawlers that don't run JavaScript — which is most answer-engine crawlers. Generated projects get a `SEO.md` explaining the three real options (move to Next, prerender at build time, or prerender at the edge).

## Generated layout

```
my-project/
├── apps/
│   ├── web/                 # React (Vite) or Next.js
│   └── expo/                # xocket add expo
├── services/                # xocket add backend | agent
│   └── orders-api/
├── packages/
│   ├── ui/                  # shared components + design tokens
│   ├── db/                  # xocket add db
│   ├── typescript-config/
│   ├── eslint-config/
│   └── prettier-config/
├── infra/k8s/               # xocket add docker --target k8s
├── docker-compose.yml
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
pnpm test                          # 92 unit + generator regression tests
node dist/index.js create demo --yes --no-install --no-git
```

CI scaffolds a real project for every framework × state × backend combination and runs `lint`, `type-check` and `build` against it, plus separate jobs for Expo, each backend language, each optional module, and a full-stack preset that also builds the generated Dockerfiles. See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Contributing

Contributions are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) covers the setup
and, more importantly, the one thing to understand first: **Xocket's product is
the project it generates**, so a change is only proven when the generated
project still passes `lint`, `type-check`, `build` and `test`.

```bash
pnpm verify:output       # scaffold a throwaway project and run every gate
```

- [Report a bug](https://github.com/OceanLab-Technology/xocket/issues/new?template=bug_report.yml)
  — run `xocket doctor` first and paste the output
- [Request a feature](https://github.com/OceanLab-Technology/xocket/issues/new?template=feature_request.yml)
- [Discussions](https://github.com/OceanLab-Technology/xocket/discussions)
- [Security policy](SECURITY.md) — please report privately
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

[MIT](LICENSE) © Xocket Labs Inc. (Delaware, USA) and [OceanLab Technology](https://oceanlab.in)
