import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy packages/db/.env.example and fill it in.');
}

// One pooled client per process. Serverless runtimes should set max: 1.
const client = postgres(connectionString, {
  max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 10,
});

export const db = drizzle(client, { schema });

export * from './schema.js';
export { schema };
