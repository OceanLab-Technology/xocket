import fs from 'fs-extra';
import path from 'path';
import { presetSchema, formatZodError, type Preset } from '../schema.js';

/**
 * Load an org preset from a local path or an https URL.
 *
 * Presets let a team pin the choices they always make ("we are always Next +
 * Supabase + SEO, and we always add a Go service") without maintaining a fork
 * of the CLI.
 */
export async function loadPreset(source: string): Promise<Preset> {
  const raw = source.startsWith('http://') || source.startsWith('https://')
    ? await fetchPreset(source)
    : await readPresetFile(source);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Preset at ${source} is not valid JSON.`);
  }

  const result = presetSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Preset at ${source} is not valid:\n${formatZodError(result.error)}`);
  }
  return result.data;
}

async function fetchPreset(url: string): Promise<string> {
  if (url.startsWith('http://')) {
    throw new Error('Refusing to load a preset over plain HTTP — use https.');
  }

  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Could not fetch preset: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function readPresetFile(file: string): Promise<string> {
  const resolved = path.resolve(process.cwd(), file);
  if (!(await fs.pathExists(resolved))) {
    throw new Error(`Preset file not found: ${resolved}`);
  }
  return fs.readFile(resolved, 'utf-8');
}

/**
 * Normalise a preset's `modules` list into a flat, uniform shape.
 * Entries may be a bare string or an object with options.
 */
export function presetModules(preset: Preset): Array<{
  module: string;
  lang?: string;
  orm?: string;
  name?: string;
  target?: string;
}> {
  return preset.modules.map((m) => (typeof m === 'string' ? { module: m } : m));
}
