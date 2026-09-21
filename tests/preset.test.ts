import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';

import { tmpDir } from './helpers.js';
import { loadPreset, presetModules } from '../src/utils/preset.js';
import { collectCreateAnswers } from '../src/cli/prompts/create.prompts.js';

describe('loadPreset', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await tmpDir('xocket-preset-');
  });
  afterAll(async () => fs.remove(dir));

  async function write(name: string, body: unknown) {
    const file = path.join(dir, name);
    await fs.writeFile(file, typeof body === 'string' ? body : JSON.stringify(body));
    return file;
  }

  it('loads a partial preset and defaults modules to empty', async () => {
    const file = await write('partial.json', { framework: 'next' });
    const preset = await loadPreset(file);
    expect(preset.framework).toBe('next');
    expect(preset.modules).toEqual([]);
  });

  it('rejects an unknown framework with a readable message', async () => {
    const file = await write('bad.json', { framework: 'svelte' });
    await expect(loadPreset(file)).rejects.toThrow(/framework/);
  });

  it('rejects malformed JSON', async () => {
    const file = await write('broken.json', '{ not json');
    await expect(loadPreset(file)).rejects.toThrow(/not valid JSON/);
  });

  it('reports a missing file rather than throwing ENOENT', async () => {
    await expect(loadPreset(path.join(dir, 'nope.json'))).rejects.toThrow(/not found/);
  });

  it('refuses plain HTTP', async () => {
    // A preset controls what gets written to disk; it must not be MITM-able.
    await expect(loadPreset('http://example.com/preset.json')).rejects.toThrow(/https/);
  });

  it('normalises both string and object module entries', async () => {
    const file = await write('mods.json', {
      modules: ['auth-ui', { module: 'backend', lang: 'go', name: 'orders' }],
    });
    const preset = await loadPreset(file);
    expect(presetModules(preset)).toEqual([
      { module: 'auth-ui' },
      { module: 'backend', lang: 'go', name: 'orders' },
    ]);
  });
});

describe('answer precedence', () => {
  it('prefers an explicit flag over the preset', async () => {
    const answers = await collectCreateAnswers(
      { name: 'x', framework: 'react', yes: true },
      { framework: 'next', backend: 'cognito' },
    );
    expect(answers.framework).toBe('react');
    // Not overridden by a flag, so the preset still wins over the default.
    expect(answers.backend).toBe('cognito');
  });

  it('falls back to defaults for anything neither supplies', async () => {
    const answers = await collectCreateAnswers({ name: 'x', yes: true }, {});
    expect(answers.framework).toBe('react');
    expect(answers.stateManagement).toBe('zustand');
  });

  it('treats --ai-seo as implying --seo', async () => {
    const answers = await collectCreateAnswers({ name: 'x', aiSeo: true, yes: true });
    expect(answers.seo).toBe(true);
    expect(answers.aiSeo).toBe(true);
  });

  it('never enables aiSeo when seo is off', async () => {
    const answers = await collectCreateAnswers({ name: 'x', seo: false, yes: true });
    expect(answers.seo).toBe(false);
    expect(answers.aiSeo).toBe(false);
  });
});

describe('ui helpers', () => {
  it('renders a gradient without throwing when colour is unavailable', async () => {
    const { gradient } = await import('../src/ui/theme.js');
    expect(typeof gradient('Xocket')).toBe('string');
    expect(gradient('Xocket')).toContain('X');
  });

  it('aligns key/value rows', async () => {
    const { keyValues } = await import('../src/ui/summary.js');
    const out = keyValues([
      { label: 'A', value: '1' },
      { label: 'Longer', value: '2' },
    ]);
    expect(out.split('\n')).toHaveLength(2);
  });
});

describe('os tmpdir sanity', () => {
  it('uses a real temp directory', () => {
    expect(os.tmpdir()).toBeTruthy();
  });
});

describe('applyPresetModules', () => {
  let cwd: string;

  beforeAll(async () => {
    cwd = await tmpDir('xocket-apply-');
  });
  afterAll(async () => fs.remove(cwd));

  it('registers every module in the manifest, and orders docker last', async () => {
    const { testConfig } = await import('./helpers.js');
    const { generateWorkspace } = await import('../src/generators/monorepo/workspace.js');
    const { generateProject } = await import('../src/generators/project.js');
    const { writeManifest, createManifest, readManifest } =
      await import('../src/utils/manifest.js');
    const { applyPresetModules } = await import('../src/cli/commands/apply-modules.js');
    const { Steps } = await import('../src/ui/steps.js');

    const config = testConfig(cwd, { projectName: 'applied', framework: 'next' });
    await generateWorkspace(config);
    await generateProject(config);

    // create() must write the manifest BEFORE modules run — each one registers
    // itself there, and docker reads it back to decide what to containerise.
    // With the manifest missing, every module failed with ENOENT and docker
    // produced nothing.
    await writeManifest(config.rootDir, createManifest(config));

    await applyPresetModules(
      config,
      [
        { module: 'docker', target: 'compose' },
        { module: 'backend', lang: 'go', name: 'svc-a' },
        { module: 'db', orm: 'drizzle' },
      ],
      new Steps(1),
    );

    const found = await readManifest(config.rootDir);
    expect(found).not.toBeNull();
    expect(Object.keys(found!.manifest.services)).toContain('svc-a');
    expect(found!.manifest.db?.orm).toBe('drizzle');
    expect(found!.manifest.modules).toEqual(expect.arrayContaining(['backend', 'db', 'docker']));

    // docker ran last, so compose must list the service the preset added
    // after it in the source list.
    const compose = await fs.readFile(path.join(config.rootDir, 'docker-compose.yml'), 'utf-8');
    expect(compose).toContain('svc-a:');
    expect(compose).toContain('postgres:');
  });
});
