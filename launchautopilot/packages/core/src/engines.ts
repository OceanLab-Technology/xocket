/**
 * Common interface for every answer engine. Each adapter lives in the worker
 * and talks to one official API (or a licensed data vendor); every result is
 * stored with the channel it came from, because API and in-app answers differ.
 */

import type { Engine } from './stats.js';

export type Channel = 'api' | 'licensed_ui';

export interface EngineQuery {
  prompt: string;
  locale: string;
  grounding: boolean;
}

export interface EngineAnswer {
  engine: Engine;
  channel: Channel;
  model: string;
  answer: string;
  citations: string[];
  fetchedAt: Date;
}

export interface EngineAdapter {
  engine: Engine;
  channel: Channel;
  query(q: EngineQuery): Promise<EngineAnswer>;
}

export interface SampleJob {
  promptId: string;
  engine: Engine;
  locale: string;
  run: number;
}

/**
 * Expand a frozen prompt set into sample jobs. Prompts whose mention rate is
 * already pinned near 0% or 100% get fewer runs; uncertain ones get more.
 */
export function planSamples(
  prompts: { id: string; lastRate?: number; lastSamples?: number }[],
  engines: Engine[],
  locale: string,
  baseRuns = 8,
): SampleJob[] {
  const jobs: SampleJob[] = [];
  for (const p of prompts) {
    const settled =
      p.lastRate !== undefined &&
      (p.lastSamples ?? 0) >= 20 &&
      (p.lastRate <= 0.02 || p.lastRate >= 0.98);
    const runs = settled ? Math.max(3, Math.floor(baseRuns / 2)) : baseRuns;
    for (const engine of engines) {
      for (let run = 0; run < runs; run++) jobs.push({ promptId: p.id, engine, locale, run });
    }
  }
  return jobs;
}

/** Case-insensitive whole-word match of any product alias in an answer. */
export function mentionsProduct(answer: string, aliases: string[]): boolean {
  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'iu').test(answer);
  });
}
