import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';

import { tmpDir, testConfig, readJson, exists } from './helpers.js';
import { deriveAppConfig } from '../src/cli/config.js';
import { generateWorkspace } from '../src/generators/monorepo/workspace.js';
import { generateTypescriptConfig } from '../src/generators/packages/typescript-config.js';
import { generateExpo } from '../src/generators/expo/index.js';

describe('deriveAppConfig', () => {
  it('recomputes isNext/isReact together with framework', () => {
    const base = testConfig('/tmp', { framework: 'next' });
    expect(base.isNext).toBe(true);

    const expo = deriveAppConfig(base, { framework: 'react', target: 'expo' });
    // The old code spread the web config and overrode only `framework`,
    // leaving isNext true for the Expo app.
    expect(expo.framework).toBe('react');
    expect(expo.isNext).toBe(false);
    expect(expo.isReact).toBe(true);
    expect(expo.target).toBe('expo');
  });
});

describe('expo app generation', () => {
  let cwd: string;
  let expoDir: string;

  beforeAll(async () => {
    cwd = await tmpDir();
    // Deliberately start from a Next web app — the Expo app must not inherit it.
    const config = testConfig(cwd, { projectName: 'mob', framework: 'next', backend: 'supabase' });
    await generateWorkspace(config);
    await generateTypescriptConfig(config);
    await generateExpo(config, config.rootDir);
    expoDir = path.join(config.rootDir, 'apps/expo');
  });

  afterAll(async () => {
    await fs.remove(cwd);
  });

  it('uses EXPO_PUBLIC_ for the API base URL', async () => {
    const axios = await fs.readFile(path.join(expoDir, 'src/api/axios.ts'), 'utf-8');
    expect(axios).toContain('process.env.EXPO_PUBLIC_API_URL');
    expect(axios).not.toContain('NEXT_PUBLIC_');
    expect(axios).not.toContain('import.meta.env');
  });

  it('uses EXPO_PUBLIC_ for the Supabase client', async () => {
    const supa = await fs.readFile(path.join(expoDir, 'src/lib/supabase/browser.ts'), 'utf-8');
    expect(supa).toContain('process.env.EXPO_PUBLIC_SUPABASE_URL');
    expect(supa).not.toContain('import.meta.env');
  });

  it('never uses the Next SSR Supabase split', async () => {
    // next/headers does not exist under Metro.
    expect(await exists(path.join(expoDir, 'src/lib/supabase/server.ts'))).toBe(false);
  });

  it('writes its own env files', async () => {
    const env = await fs.readFile(path.join(expoDir, '.env.example'), 'utf-8');
    expect(env).toContain('EXPO_PUBLIC_API_URL');
    expect(await exists(path.join(expoDir, '.env.development'))).toBe(true);
  });

  it('ships an eslint config to match its lint script', async () => {
    const pkg = await readJson<Record<string, any>>(path.join(expoDir, 'package.json'));
    expect(pkg.scripts.lint).toBe('eslint .');
    // A lint script with no config made `turbo lint` fail at the root.
    expect(await exists(path.join(expoDir, 'eslint.config.js'))).toBe(true);
  });

  it('does not reference template assets that are not shipped', async () => {
    const appJson = await readJson<Record<string, any>>(path.join(expoDir, 'app.json'));
    const raw = JSON.stringify(appJson);
    expect(raw).not.toContain('assets/images');
  });
});
