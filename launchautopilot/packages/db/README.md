# @xocket/db

Drizzle schema and client, shared across every app and service.

## Usage

```ts
import { db, users } from '@xocket/db';

const all = await db.select().from(users);
```

Add it to a workspace first:

```bash
pnpm --filter <workspace> add '@xocket/db@workspace:*'
```

## Migrations

```bash
pnpm --filter @xocket/db db:generate   # write a migration from schema.ts
pnpm --filter @xocket/db db:migrate    # apply it
pnpm --filter @xocket/db db:studio     # browse the data
```

`db:push` skips migration files and syncs the schema directly — convenient
locally, not something to point at production.

## Environment

`DATABASE_URL` must be set wherever the client is imported, including in the
app that consumes it — not just here.
