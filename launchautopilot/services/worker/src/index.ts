import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { z } from 'zod';
import { visibilityScore } from '@launchautopilot/core/stats';
import { JOBS } from './jobs.js';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', service: 'worker' }));

app.get('/jobs', (c) => c.json(JOBS));

const sampleSchema = z.object({
  mentions: z.number().int().min(0),
  samples: z.number().int().min(0),
});
const scoreSchema = z.partialRecord(
  z.enum(['chatgpt', 'google_aio', 'perplexity', 'gemini', 'claude']),
  sampleSchema,
);

// Preview the AI Visibility Score for raw counts.
app.post('/score', async (c) => {
  const parsed = scoreSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', issues: parsed.error.issues }, 400);
  }
  return c.json(visibilityScore(parsed.data));
});

const echoSchema = z.object({ message: z.string().min(1) });

app.post('/echo', async (c) => {
  const parsed = echoSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', issues: parsed.error.issues }, 400);
  }
  return c.json({ echo: parsed.data.message });
});

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.warn(`worker listening on http://localhost:${info.port}`);
});
