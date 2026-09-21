#!/usr/bin/env node
/**
 * Scaffold a throwaway project and run every gate against it.
 *
 * Xocket's product is the project it generates, so the CLI's own tests passing
 * proves very little on its own. This is the check to run before pushing a
 * generator change; CI runs the full combination matrix.
 *
 *   pnpm verify:output
 *   pnpm verify:output -- --framework react --keep
 */
import { execa } from 'execa';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);

const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const keep = argv.includes('--keep');
const framework = flag('framework', 'next');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xocket-verify-'));
const app = path.join(dir, 'verify-app');

const step = (msg) => console.log(`\n\u001B[36m▸\u001B[39m ${msg}`);
let failed = false;

try {
  step('Building the CLI');
  await execa('pnpm', ['build'], { cwd: root, stdio: 'inherit' });

  step(`Scaffolding a ${framework} project`);
  await execa(
    'node',
    [
      path.join(root, 'dist/index.js'),
      'create',
      'verify-app',
      '--yes',
      '--no-git',
      '-f',
      framework,
      '-s',
      'zustand',
      '-b',
      'supabase',
      '--ai-seo',
    ],
    { cwd: dir, stdio: 'inherit' },
  );

  for (const task of ['lint', 'type-check', 'build', 'test', 'format:check']) {
    step(`pnpm ${task}`);
    await execa('pnpm', [task], { cwd: app, stdio: 'inherit' });
  }

  step('xocket doctor');
  await execa('node', [path.join(root, 'dist/index.js'), 'doctor'], {
    cwd: app,
    stdio: 'inherit',
  });

  console.log('\n\u001B[32m✓ The generated project passes every gate.\u001B[39m\n');
} catch (error) {
  failed = true;
  console.error('\n\u001B[31m✗ Verification failed.\u001B[39m');
  console.error(error.shortMessage ?? error.message);
  console.error(`\nThe project was left at ${app} so you can inspect it.`);
  process.exitCode = 1;
} finally {
  // Keep the tree around on failure — that is when you need to look at it.
  if (!keep && !failed) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
