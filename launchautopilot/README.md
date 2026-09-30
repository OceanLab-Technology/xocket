# LaunchAutopilot

A weekly launch directory that measures and proves AI visibility. Makers launch in a
curated cohort, get a baseline of how often ChatGPT, Perplexity, Gemini, Claude and
Google's AI answers mention them, get a list of the sites those engines cite that
they're missing, and get a before/after report at +30 and +90 days.

- Plan: [docs/MVP-SPEC.md](docs/MVP-SPEC.md)
- The rules behind every score: [docs/GROWTH-LOGIC.md](docs/GROWTH-LOGIC.md)

## Layout

| Path              | Role                                                                                |
| ----------------- | ----------------------------------------------------------------------------------- |
| `apps/web`        | Next.js directory, maker dashboard, public AI Recommendation Index                  |
| `services/worker` | Scheduled jobs: cohorts, sampling, extraction, metrics, proof reports, Reddit queue |
| `packages/core`   | All scoring and policy logic, pure and tested. **The only place rules live.**       |
| `packages/db`     | Drizzle schema for Postgres                                                         |
| `packages/ui`     | Shared components                                                                   |

## Develop

```bash
pnpm install
pnpm dev          # web on :3000, worker on :3001
pnpm test         # core logic + web smoke tests
pnpm lint && pnpm type-check && pnpm build
```

Set `DATABASE_URL` in `packages/db/.env`, then `pnpm --filter @xocket/db db:generate`.

Scaffolded with [Xocket](https://github.com/OceanLab-Technology/xocket).
