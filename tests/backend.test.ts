import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';

import { tmpDir, testConfig, readJson, exists } from './helpers.js';
import { generateWorkspace } from '../src/generators/monorepo/workspace.js';
import { generateBackend } from '../src/generators/backend/index.js';
import { BACKEND_LANGS } from '../src/schema.js';

describe('backend services', () => {
  let cwd: string;
  let rootDir: string;

  beforeAll(async () => {
    cwd = await tmpDir();
    const config = testConfig(cwd, { projectName: 'poly' });
    rootDir = config.rootDir;
    await generateWorkspace(config);
    for (const lang of BACKEND_LANGS) {
      await generateBackend(config, rootDir, { lang, name: `${lang}-api` });
    }
  });

  afterAll(async () => {
    await fs.remove(cwd);
  });

  it('declares services/* as a workspace so non-JS packages join the graph', async () => {
    const ws = await fs.readFile(path.join(rootDir, 'pnpm-workspace.yaml'), 'utf-8');
    expect(ws).toContain("'services/*'");
  });

  it.each(BACKEND_LANGS)(
    'gives %s a package.json shim with build and dev scripts',
    async (lang) => {
      const pkg = await readJson<Record<string, any>>(
        path.join(rootDir, 'services', `${lang}-api`, 'package.json'),
      );
      expect(pkg.name).toBe(`${lang}-api`);
      expect(pkg.scripts.build).toBeTruthy();
      expect(pkg.scripts.dev).toBeTruthy();
    },
  );

  it.each(BACKEND_LANGS)('gives %s a turbo.json declaring its build outputs', async (lang) => {
    const turbo = await readJson<Record<string, any>>(
      path.join(rootDir, 'services', `${lang}-api`, 'turbo.json'),
    );
    expect(turbo.extends).toEqual(['//']);
    expect(turbo.tasks.build.outputs.length).toBeGreaterThan(0);
  });

  it('shells out to each native toolchain rather than to node', async () => {
    const script = async (lang: string) =>
      (
        await readJson<Record<string, any>>(
          path.join(rootDir, 'services', `${lang}-api`, 'package.json'),
        )
      ).scripts.build;

    expect(await script('go')).toContain('go build');
    expect(await script('rust')).toContain('cargo build');
    expect(await script('python')).toContain('uv sync');
    expect(await script('node')).toContain('tsup');
  });

  it('writes real entry points per language', async () => {
    expect(await exists(path.join(rootDir, 'services/go-api/main.go'))).toBe(true);
    expect(await exists(path.join(rootDir, 'services/rust-api/Cargo.toml'))).toBe(true);
    expect(await exists(path.join(rootDir, 'services/python-api/pyproject.toml'))).toBe(true);
    expect(await exists(path.join(rootDir, 'services/node-api/src/index.ts'))).toBe(true);
  });

  it('converts hyphenated names into valid crate and module identifiers', async () => {
    const config = testConfig(cwd, { projectName: 'poly' });
    await generateBackend(config, rootDir, { lang: 'rust', name: 'orders-api' });
    const cargo = await fs.readFile(path.join(rootDir, 'services/orders-api/Cargo.toml'), 'utf-8');
    expect(cargo).toContain('name = "orders_api"');

    await generateBackend(config, rootDir, { lang: 'python', name: 'billing-api' });
    expect(await exists(path.join(rootDir, 'services/billing-api/billing_api/main.py'))).toBe(true);
  });

  it('refuses to overwrite an existing service', async () => {
    const config = testConfig(cwd, { projectName: 'poly' });
    await expect(generateBackend(config, rootDir, { lang: 'go', name: 'go-api' })).rejects.toThrow(
      /already exists/,
    );
  });
});
