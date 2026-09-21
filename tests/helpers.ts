import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { buildConfig } from '../src/cli/config.js';
import { answersSchema, type Answers, type Config } from '../src/schema.js';

/** Create an isolated temp directory that the caller is responsible for removing. */
export async function tmpDir(prefix = 'xocket-test-'): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export const BASE_ANSWERS: Answers = {
  projectName: 'test-app',
  framework: 'react',
  stateManagement: 'zustand',
  serverState: 'tanstack',
  backend: 'supabase',
  seo: false,
  aiSeo: false,
};

/** Build a Config rooted at `cwd`, overriding any answer fields. */
export function testConfig(cwd: string, overrides: Partial<Answers> = {}): Config {
  return buildConfig(answersSchema.parse({ ...BASE_ANSWERS, ...overrides }), cwd);
}

export async function readJson<T = unknown>(file: string): Promise<T> {
  return fs.readJson(file) as Promise<T>;
}

export async function exists(file: string): Promise<boolean> {
  return fs.pathExists(file);
}
