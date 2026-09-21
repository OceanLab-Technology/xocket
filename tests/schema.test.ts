import { describe, expect, it } from 'vitest';
import {
  answersSchema,
  createFlagsSchema,
  manifestSchema,
  projectNameSchema,
  formatZodError,
} from '../src/schema.js';

describe('projectNameSchema', () => {
  it.each(['my-app', 'app', 'my_app', 'a1', 'my.app'])('accepts %s', (name) => {
    expect(projectNameSchema.parse(name)).toBe(name);
  });

  it.each([
    ['', 'empty'],
    ['My-App', 'uppercase'],
    ['-leading', 'leading hyphen'],
    ['has space', 'space'],
    ['has/slash', 'path separator'],
    ['node_modules', 'npm-reserved'],
  ])('rejects %s (%s)', (name) => {
    expect(projectNameSchema.safeParse(name).success).toBe(false);
  });

  it('trims surrounding whitespace', () => {
    expect(projectNameSchema.parse('  my-app  ')).toBe('my-app');
  });
});

describe('answersSchema', () => {
  const valid = {
    projectName: 'app',
    framework: 'next',
    stateManagement: 'redux',
    serverState: 'none',
    backend: 'cognito',
    seo: true,
    aiSeo: false,
  };

  it('accepts a complete answer set', () => {
    expect(answersSchema.parse(valid)).toEqual(valid);
  });

  it('rejects an unknown framework', () => {
    const r = answersSchema.safeParse({ ...valid, framework: 'svelte' });
    expect(r.success).toBe(false);
    if (!r.success) expect(formatZodError(r.error)).toContain('framework');
  });

  it('rejects an unknown backend', () => {
    expect(answersSchema.safeParse({ ...valid, backend: 'firebase' }).success).toBe(false);
  });
});

describe('createFlagsSchema', () => {
  it('treats every flag as optional', () => {
    expect(createFlagsSchema.parse({})).toEqual({});
  });

  it('rejects an invalid enum value', () => {
    expect(createFlagsSchema.safeParse({ state: 'mobx' }).success).toBe(false);
  });
});

describe('manifestSchema', () => {
  const base = {
    version: '2.0.0',
    createdAt: new Date().toISOString(),
    projectName: 'app',
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
    packages: [],
  };

  it('defaults services, modules and the seo flags', () => {
    const m = manifestSchema.parse(base);
    expect(m.services).toEqual({});
    expect(m.modules).toEqual([]);
    expect(m.apps.web!.seo).toBe(false);
    expect(m.apps.web!.aiSeo).toBe(false);
  });

  it('rejects a manifest whose app has an unknown backend', () => {
    const bad = { ...base, apps: { web: { ...base.apps.web, backend: 'nope' } } };
    expect(manifestSchema.safeParse(bad).success).toBe(false);
  });
});
