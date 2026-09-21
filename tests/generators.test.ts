import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';

import { tmpDir, testConfig, readJson, exists } from './helpers.js';
import { generateWorkspace } from '../src/generators/monorepo/workspace.js';
import { generateTypescriptConfig } from '../src/generators/packages/typescript-config.js';
import { generateEslintConfig } from '../src/generators/packages/eslint-config.js';
import { generatePrettierConfig } from '../src/generators/packages/prettier-config.js';
import { generateProject } from '../src/generators/project.js';
import { generateTypescript } from '../src/generators/typescript.js';
import { generateStyling } from '../src/generators/styling.js';
import { generateSentry } from '../src/generators/sentry.js';
import { generateSeo } from '../src/generators/seo/index.js';
import { generateEnvironment } from '../src/generators/environment.js';
import type { Config } from '../src/schema.js';

/**
 * Each test here pins a bug that previously shipped. If one fails, the
 * generated project is broken again in exactly the way described.
 */
describe('generator regressions', () => {
  let cwd: string;

  beforeAll(async () => {
    cwd = await tmpDir();
  });

  afterAll(async () => {
    await fs.remove(cwd);
  });

  async function scaffold(overrides: Parameters<typeof testConfig>[1] = {}): Promise<Config> {
    const config = testConfig(cwd, {
      projectName: `p-${Math.random().toString(36).slice(2, 8)}`,
      ...overrides,
    });
    await generateWorkspace(config);
    await generateTypescriptConfig(config);
    await generateEslintConfig(config);
    await generatePrettierConfig(config);
    await generateProject(config);
    await generateTypescript(config);
    return config;
  }

  it('keeps include/paths out of the shared tsconfig so tsc finds the app sources', async () => {
    const config = await scaffold();
    const shared = await readJson<Record<string, unknown>>(
      path.join(config.rootDir, 'packages/typescript-config/web.json'),
    );
    // Relative paths resolve against the file that declares them, so these
    // must not live in the shared package — that caused TS18003.
    expect(shared).not.toHaveProperty('include');
    expect(shared).not.toHaveProperty('exclude');
    expect((shared.compilerOptions as Record<string, unknown>)).not.toHaveProperty('baseUrl');
    expect((shared.compilerOptions as Record<string, unknown>)).not.toHaveProperty('paths');

    const app = await readJson<Record<string, any>>(
      path.join(config.webDir, 'tsconfig.json'),
    );
    expect(app.include).toContain('src');
    expect(app.compilerOptions.paths['@/*']).toEqual(['./src/*']);
  });

  it('exports every eslint entry point both with and without the .js suffix', async () => {
    const config = await scaffold();
    const pkg = await readJson<Record<string, any>>(
      path.join(config.rootDir, 'packages/eslint-config/package.json'),
    );
    // Apps import '@xocket/eslint-config/react.js'; a map with only './react'
    // threw ERR_PACKAGE_PATH_NOT_EXPORTED.
    expect(pkg.exports['./react.js']).toBe('./react.js');
    expect(pkg.exports['./react']).toBe('./react.js');
    expect(pkg.exports['./base.js']).toBe('./base.js');
  });

  it('marks the prettier config package as ESM', async () => {
    const config = await scaffold();
    const pkg = await readJson<Record<string, any>>(
      path.join(config.rootDir, 'packages/prettier-config/package.json'),
    );
    // index.js uses `export default`, so Node needs type: module to parse it.
    expect(pkg.type).toBe('module');
  });

  it('gives the root the dependencies its own scripts and hooks need', async () => {
    const config = await scaffold();
    const pkg = await readJson<Record<string, any>>(
      path.join(config.rootDir, 'package.json'),
    );
    // lint-staged runs eslint at the root; .prettierrc resolves the shared config.
    expect(pkg.devDependencies).toHaveProperty('eslint');
    expect(pkg.devDependencies).toHaveProperty('@xocket/prettier-config');
    expect(pkg.prettier).toBe('@xocket/prettier-config');
  });

  it('never emits `--ext`, which ESLint 9 removed', async () => {
    const config = await scaffold();
    const pkg = await readJson<Record<string, any>>(path.join(config.webDir, 'package.json'));
    expect(pkg.scripts.lint).toBe('eslint .');
  });

  it('emits no Tailwind v3 config and no top-level await', async () => {
    const config = await scaffold();
    await generateStyling(config);
    // Tailwind v4 is CSS-first; the old generated config contained a
    // top-level `await import(...)` that its loader could not parse.
    expect(await exists(path.join(config.webDir, 'tailwind.config.js'))).toBe(false);
    const css = await fs.readFile(path.join(config.webDir, 'src/index.css'), 'utf-8');
    expect(css).toContain("@import 'tailwindcss'");
    expect(css).not.toContain('await import');
  });

  it('defines the shadcn design tokens the starter page uses', async () => {
    const config = await scaffold();
    await generateStyling(config);
    const css = await fs.readFile(path.join(config.webDir, 'src/index.css'), 'utf-8');
    // bg-background / text-muted-foreground appear in the template itself.
    expect(css).toContain('--color-background:');
    expect(css).toContain('--color-muted-foreground:');
    expect(css).toMatch(/\.dark\s*\{/);
  });

  it('removes the stale next.config.js when wiring Sentry into Next', async () => {
    const config = await scaffold({ framework: 'next' });
    await generateSentry(config);
    // Both files present meant Next loaded the empty .js and ignored Sentry.
    expect(await exists(path.join(config.webDir, 'next.config.js'))).toBe(false);
    expect(await exists(path.join(config.webDir, 'next.config.ts'))).toBe(true);
    const cfg = await fs.readFile(path.join(config.webDir, 'next.config.ts'), 'utf-8');
    expect(cfg).toContain('withSentryConfig');
  });

  it('uses the Sentry v9+ instrumentation hooks, not sentry.*.config.ts', async () => {
    const config = await scaffold({ framework: 'next' });
    await generateSentry(config);
    expect(await exists(path.join(config.webDir, 'instrumentation.ts'))).toBe(true);
    expect(await exists(path.join(config.webDir, 'instrumentation-client.ts'))).toBe(true);
    expect(await exists(path.join(config.webDir, 'sentry.client.config.ts'))).toBe(false);
  });
});

describe('seo module', () => {
  let cwd: string;
  beforeAll(async () => {
    cwd = await tmpDir();
  });
  afterAll(async () => {
    await fs.remove(cwd);
  });

  async function scaffoldSeo(overrides: Parameters<typeof testConfig>[1]) {
    const config = testConfig(cwd, {
      projectName: `s-${Math.random().toString(36).slice(2, 8)}`,
      ...overrides,
    });
    await generateWorkspace(config);
    await generateProject(config);
    await generateEnvironment(config);
    await generateSeo(config);
    return config;
  }

  it('writes nothing when seo is off', async () => {
    const config = await scaffoldSeo({ seo: false, framework: 'next' });
    expect(await exists(path.join(config.webDir, 'src/lib/seo.ts'))).toBe(false);
    expect(await exists(path.join(config.webDir, 'src/app/robots.ts'))).toBe(false);
  });

  it('adds metadata routes for Next', async () => {
    const config = await scaffoldSeo({ seo: true, framework: 'next' });
    for (const f of ['src/lib/seo.ts', 'src/app/robots.ts', 'src/app/sitemap.ts', 'src/app/opengraph-image.tsx']) {
      expect(await exists(path.join(config.webDir, f))).toBe(true);
    }
  });

  it('omits AI crawler rules unless aiSeo is on', async () => {
    const off = await scaffoldSeo({ seo: true, aiSeo: false, framework: 'next' });
    const robotsOff = await fs.readFile(path.join(off.webDir, 'src/app/robots.ts'), 'utf-8');
    expect(robotsOff).not.toContain('GPTBot');
    expect(await exists(path.join(off.webDir, 'public/llms.txt'))).toBe(false);

    const on = await scaffoldSeo({ seo: true, aiSeo: true, framework: 'next' });
    const robotsOn = await fs.readFile(path.join(on.webDir, 'src/app/robots.ts'), 'utf-8');
    expect(robotsOn).toContain('GPTBot');
    expect(robotsOn).toContain('ClaudeBot');
    expect(await exists(path.join(on.webDir, 'public/llms.txt'))).toBe(true);
    expect(await exists(path.join(on.webDir, 'public/llms-full.txt'))).toBe(true);
  });

  it('adds a SITE_URL variable using the target env prefix', async () => {
    const config = await scaffoldSeo({ seo: true, framework: 'react' });
    const env = await fs.readFile(path.join(config.webDir, '.env.example'), 'utf-8');
    expect(env).toContain('VITE_SITE_URL=');
  });

  it('falls back to static files for a Vite SPA', async () => {
    const config = await scaffoldSeo({ seo: true, framework: 'react' });
    expect(await exists(path.join(config.webDir, 'public/robots.txt'))).toBe(true);
    expect(await exists(path.join(config.webDir, 'public/sitemap.xml'))).toBe(true);
    expect(await exists(path.join(config.webDir, 'src/lib/use-seo.ts'))).toBe(true);
  });
});
