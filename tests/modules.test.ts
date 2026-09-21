import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';

import { tmpDir, testConfig, readJson, exists } from './helpers.js';
import { generateWorkspace } from '../src/generators/monorepo/workspace.js';
import { generateProject } from '../src/generators/project.js';
import { generateApi } from '../src/generators/api.js';
import { generateAuthentication } from '../src/generators/authentication.js';
import { generateDb } from '../src/generators/db/index.js';
import { generateAuthUi } from '../src/generators/auth-ui.js';
import { generateAgent } from '../src/generators/agent.js';
import { generateDocker } from '../src/generators/docker.js';
import { generateUiPackage } from '../src/generators/packages/ui.js';
import { generateTesting } from '../src/generators/testing.js';
import { generateCiWorkflow } from '../src/generators/ci.js';
import { manifestSchema, type Manifest } from '../src/schema.js';

describe('shared ui package', () => {
  let cwd: string;
  let pkgDir: string;

  beforeAll(async () => {
    cwd = await tmpDir();
    const config = testConfig(cwd, { projectName: 'uip' });
    await generateWorkspace(config);
    await generateUiPackage(config);
    pkgDir = path.join(config.rootDir, 'packages/ui');
  });
  afterAll(async () => fs.remove(cwd));

  it('exposes components, utils and the token layer via exports', async () => {
    const pkg = await readJson<Record<string, any>>(path.join(pkgDir, 'package.json'));
    expect(pkg.exports['./styles.css']).toBeTruthy();
    expect(pkg.exports['./lib/utils']).toBeTruthy();
    expect(pkg.exports['./components/*']).toBeTruthy();
  });

  it('holds the design tokens so apps cannot drift apart', async () => {
    const css = await fs.readFile(path.join(pkgDir, 'src/styles.css'), 'utf-8');
    expect(css).toContain('--color-background:');
    expect(css).toMatch(/\.dark\s*\{/);
  });

  it('ships at least one real component', async () => {
    expect(await exists(path.join(pkgDir, 'src/components/button.tsx'))).toBe(true);
  });
});

describe('db module', () => {
  let cwd: string;
  let rootDir: string;

  beforeAll(async () => {
    cwd = await tmpDir();
    const config = testConfig(cwd, { projectName: 'dbp' });
    rootDir = config.rootDir;
    await generateWorkspace(config);
  });
  afterAll(async () => fs.remove(cwd));

  it('generates a drizzle package with migration scripts', async () => {
    const config = testConfig(cwd, { projectName: 'dbp' });
    const dir = await generateDb(config, rootDir, { orm: 'drizzle' });
    const pkg = await readJson<Record<string, any>>(path.join(dir, 'package.json'));
    expect(pkg.dependencies).toHaveProperty('drizzle-orm');
    expect(pkg.scripts['db:generate']).toContain('drizzle-kit');
    expect(await exists(path.join(dir, 'src/schema.ts'))).toBe(true);
    expect(await exists(path.join(dir, 'drizzle.config.ts'))).toBe(true);
  });

  it('refuses to overwrite an existing db package', async () => {
    const config = testConfig(cwd, { projectName: 'dbp' });
    await expect(generateDb(config, rootDir, { orm: 'prisma' })).rejects.toThrow(/already exists/);
  });

  it('generates prisma with a postinstall generate step', async () => {
    const other = await tmpDir();
    const config = testConfig(other, { projectName: 'dbp2' });
    await generateWorkspace(config);
    const dir = await generateDb(config, config.rootDir, { orm: 'prisma' });
    const pkg = await readJson<Record<string, any>>(path.join(dir, 'package.json'));
    // Prisma Client is generated code; type-check fails without it.
    expect(pkg.scripts.postinstall).toBe('prisma generate');
    expect(await exists(path.join(dir, 'prisma/schema.prisma'))).toBe(true);
    await fs.remove(other);
  });
});

describe('auth-ui module', () => {
  let cwd: string;
  afterAll(async () => fs.remove(cwd));
  beforeAll(async () => {
    cwd = await tmpDir();
  });

  async function scaffold(overrides: Parameters<typeof testConfig>[1]) {
    const config = testConfig(cwd, {
      projectName: `a-${Math.random().toString(36).slice(2, 8)}`,
      ...overrides,
    });
    await generateWorkspace(config);
    await generateProject(config);
    await generateApi(config, config.webDir);
    await generateAuthentication(config, config.webDir);
    return config;
  }

  it('refuses when the project has no backend to sign in against', async () => {
    const config = await scaffold({ backend: 'none' });
    await expect(generateAuthUi(config)).rejects.toThrow(/no backend/i);
  });

  it('wires the form to the supabase client', async () => {
    const config = await scaffold({ backend: 'supabase', framework: 'next' });
    await generateAuthUi(config);
    const client = await fs.readFile(
      path.join(config.webDir, 'src/lib/auth/client.ts'),
      'utf-8',
    );
    expect(client).toContain('signInWithPassword');
    expect(client).toContain("'use client'");
  });

  it('wires the form to the cognito client', async () => {
    const config = await scaffold({ backend: 'cognito', framework: 'react' });
    await generateAuthUi(config);
    const client = await fs.readFile(
      path.join(config.webDir, 'src/lib/auth/client.ts'),
      'utf-8',
    );
    expect(client).toContain('aws-amplify/auth');
    // Vite apps have no client boundary directive.
    expect(client).not.toContain("'use client'");
  });

  it('adds route protection for Next only', async () => {
    const next = await scaffold({ backend: 'supabase', framework: 'next' });
    await generateAuthUi(next);
    expect(await exists(path.join(next.webDir, 'src/middleware.ts'))).toBe(true);
    expect(await exists(path.join(next.webDir, 'src/app/sign-in/page.tsx'))).toBe(true);

    const vite = await scaffold({ backend: 'supabase', framework: 'react' });
    await generateAuthUi(vite);
    expect(await exists(path.join(vite.webDir, 'src/middleware.ts'))).toBe(false);
    expect(await exists(path.join(vite.webDir, 'src/pages/sign-in.tsx'))).toBe(true);
  });
});

describe('agent module', () => {
  let cwd: string;
  beforeAll(async () => {
    cwd = await tmpDir();
  });
  afterAll(async () => fs.remove(cwd));

  it('generates a stdio MCP server that logs to stderr', async () => {
    const config = testConfig(cwd, { projectName: 'ag' });
    await generateWorkspace(config);
    const dir = await generateAgent(config, config.rootDir, { name: 'my-mcp' });

    const src = await fs.readFile(path.join(dir, 'src/index.ts'), 'utf-8');
    expect(src).toContain('StdioServerTransport');
    expect(src).toContain('registerTool');
    // stdout carries the protocol — a console.log there breaks the connection.
    expect(src).not.toMatch(/console\.log\(/);
    expect(src).toContain('console.error');

    const pkg = await readJson<Record<string, any>>(path.join(dir, 'package.json'));
    expect(pkg.dependencies).toHaveProperty('@modelcontextprotocol/sdk');
  });
});

describe('docker module', () => {
  let cwd: string;
  let rootDir: string;
  let manifest: Manifest;

  beforeAll(async () => {
    cwd = await tmpDir();
    const config = testConfig(cwd, { projectName: 'dk', framework: 'next' });
    rootDir = config.rootDir;
    await generateWorkspace(config);
    await generateProject(config);

    manifest = manifestSchema.parse({
      version: '3.0.0',
      createdAt: new Date().toISOString(),
      projectName: 'dk',
      packageManager: 'pnpm',
      apps: {
        web: {
          path: 'apps/web',
          framework: 'next',
          backend: 'supabase',
          serverState: 'tanstack',
          stateManagement: 'zustand',
          sentry: true,
        },
      },
      services: {
        'go-svc': { path: 'services/go-svc', lang: 'go' },
        'py-svc': { path: 'services/py-svc', lang: 'python' },
      },
      packages: [],
      db: { orm: 'drizzle', path: 'packages/db' },
    });

    await fs.ensureDir(path.join(rootDir, 'services/go-svc'));
    await fs.ensureDir(path.join(rootDir, 'services/py-svc'));
    await generateDocker(config, rootDir, manifest, 'both');
  });
  afterAll(async () => fs.remove(cwd));

  it('writes a Dockerfile per service in that service’s language', async () => {
    const go = await fs.readFile(path.join(rootDir, 'services/go-svc/Dockerfile'), 'utf-8');
    expect(go).toContain('FROM golang');
    expect(go).toContain('CGO_ENABLED=0');

    const py = await fs.readFile(path.join(rootDir, 'services/py-svc/Dockerfile'), 'utf-8');
    expect(py).toContain('uv');
  });

  it('never runs a container as root', async () => {
    for (const f of ['services/go-svc/Dockerfile', 'services/py-svc/Dockerfile', 'apps/web/Dockerfile']) {
      const body = await fs.readFile(path.join(rootDir, f), 'utf-8');
      expect(body).toMatch(/USER\s+(?!root)/);
    }
  });

  it('derives compose services from the manifest', async () => {
    const compose = await fs.readFile(path.join(rootDir, 'docker-compose.yml'), 'utf-8');
    expect(compose).toContain('go-svc:');
    expect(compose).toContain('py-svc:');
    // The manifest declares a db, so compose must provide one.
    expect(compose).toContain('postgres:');
    expect(compose).toContain('pg_isready');
  });

  it('emits a Deployment and Service per app with health probes', async () => {
    const web = await fs.readFile(path.join(rootDir, 'infra/k8s/web.yaml'), 'utf-8');
    expect(web).toContain('kind: Deployment');
    expect(web).toContain('kind: Service');
    expect(web).toContain('readinessProbe');

    const go = await fs.readFile(path.join(rootDir, 'infra/k8s/go-svc.yaml'), 'utf-8');
    expect(go).toContain('path: /health');
  });

  it('excludes build output and secrets from the build context', async () => {
    const ignore = await fs.readFile(path.join(rootDir, '.dockerignore'), 'utf-8');
    for (const entry of ['node_modules', '.env', '**/target', '**/.next']) {
      expect(ignore).toContain(entry);
    }
    expect(ignore).toContain('!.env.example');
  });
});

describe('testing + ci generators', () => {
  let cwd: string;
  let config: ReturnType<typeof testConfig>;

  beforeAll(async () => {
    cwd = await tmpDir();
    config = testConfig(cwd, { projectName: 'tc', framework: 'react' });
    await generateWorkspace(config);
    await generateProject(config);
    await generateTesting(config, config.webDir);
    await generateCiWorkflow(config);
  });
  afterAll(async () => fs.remove(cwd));

  it('gives the app a runnable test setup and a real test', async () => {
    const pkg = await readJson<Record<string, any>>(path.join(config.webDir, 'package.json'));
    expect(pkg.scripts.test).toBe('vitest run');
    expect(await exists(path.join(config.webDir, 'vitest.config.ts'))).toBe(true);
    expect(await exists(path.join(config.webDir, 'src/test/setup.ts'))).toBe(true);
    expect(await exists(path.join(config.webDir, 'src/test/smoke.test.tsx'))).toBe(true);
  });

  it('generates CI that runs every gate', async () => {
    const ci = await fs.readFile(
      path.join(config.rootDir, '.github/workflows/ci.yml'),
      'utf-8',
    );
    for (const step of ['pnpm lint', 'pnpm type-check', 'pnpm test', 'pnpm build']) {
      expect(ci).toContain(step);
    }
    expect(ci).toContain('--frozen-lockfile');
  });

  it('groups dependabot updates so CI stays meaningful', async () => {
    const db = await fs.readFile(
      path.join(config.rootDir, '.github/dependabot.yml'),
      'utf-8',
    );
    expect(db).toContain('package-ecosystem: npm');
    expect(db).toContain('github-actions');
  });
});
