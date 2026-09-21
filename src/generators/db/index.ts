import type { Config } from '../../types.js';
import path from 'path';
import fs from 'fs-extra';
import { writeFile, ensureDir } from '../../utils/file.js';
import { DEPS } from '../../versions.js';
import type { DbOrm } from '../../schema.js';

/**
 * Generates packages/db — the schema and client, shared by every app and
 * service in the workspace.
 *
 * It lives in packages/ rather than inside one app so a Next Route Handler and
 * a Hono service can import the same typed schema instead of redefining it.
 */
export async function generateDb(
  config: Config,
  rootDir: string,
  opts: { orm: DbOrm },
): Promise<string> {
  const pkgDir = path.join(rootDir, 'packages', 'db');

  if (await fs.pathExists(pkgDir)) {
    throw new Error('packages/db already exists — remove it first, or edit it directly.');
  }

  await ensureDir(pkgDir);

  if (opts.orm === 'drizzle') {
    await generateDrizzle(pkgDir);
  } else {
    await generatePrisma(pkgDir);
  }

  await writeFile(
    path.join(pkgDir, '.env.example'),
    `# Postgres connection string used by migrations and the client.
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
`,
  );

  return pkgDir;
}

// ── Drizzle ──────────────────────────────────────────────────────────────────

async function generateDrizzle(pkgDir: string) {
  await writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(
      {
        name: '@xocket/db',
        version: '0.0.0',
        private: true,
        type: 'module',
        exports: {
          '.': './src/index.ts',
          './schema': './src/schema.ts',
        },
        scripts: {
          'db:generate': 'drizzle-kit generate',
          'db:migrate': 'drizzle-kit migrate',
          'db:push': 'drizzle-kit push',
          'db:studio': 'drizzle-kit studio',
          lint: 'eslint .',
          'type-check': 'tsc --noEmit',
        },
        dependencies: {
          'drizzle-orm': DEPS['drizzle-orm'],
          postgres: DEPS.postgres,
        },
        devDependencies: {
          '@xocket/typescript-config': 'workspace:*',
          '@xocket/eslint-config': 'workspace:*',
          '@xocket/prettier-config': 'workspace:*',
          'drizzle-kit': DEPS['drizzle-kit'],
          '@types/node': DEPS['@types/node'],
          typescript: DEPS.typescript,
          eslint: DEPS.eslint,
        },
        prettier: '@xocket/prettier-config',
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(pkgDir, 'drizzle.config.ts'),
    `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
`,
  );

  await ensureDir(path.join(pkgDir, 'src'));

  await writeFile(
    path.join(pkgDir, 'src', 'schema.ts'),
    `import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
`,
  );

  await writeFile(
    path.join(pkgDir, 'src', 'index.ts'),
    `import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy packages/db/.env.example and fill it in.')
}

// One pooled client per process. Serverless runtimes should set max: 1.
const client = postgres(connectionString, {
  max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 10,
})

export const db = drizzle(client, { schema })

export * from './schema.js'
export { schema }
`,
  );

  await writeFile(
    path.join(pkgDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '@xocket/typescript-config/node.json',
        compilerOptions: { noEmit: true, paths: { '@/*': ['./src/*'] } },
        include: ['src', 'drizzle.config.ts'],
        exclude: ['node_modules', 'drizzle'],
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(pkgDir, 'eslint.config.js'),
    `import base from '@xocket/eslint-config/base.js'

export default base
`,
  );

  await writeFile(
    path.join(pkgDir, 'README.md'),
    `# @xocket/db

Drizzle schema and client, shared across every app and service.

## Usage

\`\`\`ts
import { db, users } from '@xocket/db'

const all = await db.select().from(users)
\`\`\`

Add it to a workspace first:

\`\`\`bash
pnpm --filter <workspace> add '@xocket/db@workspace:*'
\`\`\`

## Migrations

\`\`\`bash
pnpm --filter @xocket/db db:generate   # write a migration from schema.ts
pnpm --filter @xocket/db db:migrate    # apply it
pnpm --filter @xocket/db db:studio     # browse the data
\`\`\`

\`db:push\` skips migration files and syncs the schema directly — convenient
locally, not something to point at production.

## Environment

\`DATABASE_URL\` must be set wherever the client is imported, including in the
app that consumes it — not just here.
`,
  );
}

// ── Prisma ───────────────────────────────────────────────────────────────────

async function generatePrisma(pkgDir: string) {
  await writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(
      {
        name: '@xocket/db',
        version: '0.0.0',
        private: true,
        type: 'module',
        exports: { '.': './src/index.ts' },
        scripts: {
          'db:generate': 'prisma generate',
          'db:migrate': 'prisma migrate dev',
          'db:deploy': 'prisma migrate deploy',
          'db:push': 'prisma db push',
          'db:studio': 'prisma studio',
          // Prisma Client is generated code; it must exist before type-check.
          postinstall: 'prisma generate',
          lint: 'eslint .',
          'type-check': 'prisma generate && tsc --noEmit',
        },
        dependencies: {
          '@prisma/client': DEPS['@prisma/client'],
        },
        devDependencies: {
          '@xocket/typescript-config': 'workspace:*',
          '@xocket/eslint-config': 'workspace:*',
          '@xocket/prettier-config': 'workspace:*',
          prisma: DEPS.prisma,
          '@types/node': DEPS['@types/node'],
          typescript: DEPS.typescript,
          eslint: DEPS.eslint,
        },
        prettier: '@xocket/prettier-config',
      },
      null,
      2,
    ) + '\n',
  );

  await ensureDir(path.join(pkgDir, 'prisma'));
  await writeFile(
    path.join(pkgDir, 'prisma', 'schema.prisma'),
    `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
`,
  );

  await ensureDir(path.join(pkgDir, 'src'));
  await writeFile(
    path.join(pkgDir, 'src', 'index.ts'),
    `import { PrismaClient } from '@prisma/client'

// Next.js dev-mode hot reload re-evaluates modules, which would otherwise open
// a new pool on every change until Postgres refuses connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

export * from '@prisma/client'
`,
  );

  await writeFile(
    path.join(pkgDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '@xocket/typescript-config/node.json',
        compilerOptions: { noEmit: true },
        include: ['src'],
        exclude: ['node_modules'],
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(pkgDir, 'eslint.config.js'),
    `import base from '@xocket/eslint-config/base.js'

export default base
`,
  );

  await writeFile(
    path.join(pkgDir, 'README.md'),
    `# @xocket/db

Prisma schema and client, shared across every app and service.

## Usage

\`\`\`ts
import { db } from '@xocket/db'

const all = await db.user.findMany()
\`\`\`

Add it to a workspace first:

\`\`\`bash
pnpm --filter <workspace> add '@xocket/db@workspace:*'
\`\`\`

## Migrations

\`\`\`bash
pnpm --filter @xocket/db db:migrate   # create + apply in development
pnpm --filter @xocket/db db:deploy    # apply in CI or production
pnpm --filter @xocket/db db:studio    # browse the data
\`\`\`

Prisma Client is generated code, so \`postinstall\` runs \`prisma generate\`.
If types look stale after editing the schema, run it again.
`,
  );
}
