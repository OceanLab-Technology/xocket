import type { Config } from '../types.js';
import { execa } from 'execa';

/**
 * git init in the monorepo root (not apps/web).
 * Must run BEFORE pnpm install so the prepare script (husky) works.
 */
export async function gitInit(config: Config) {
  await execa('git', ['init'], { cwd: config.rootDir });
}

/**
 * Stage all files and create the initial scaffold commit.
 * --no-verify skips husky pre-commit so the scaffold commit itself isn't linted.
 */
export async function gitCommit(config: Config) {
  await execa('git', ['add', '.'], { cwd: config.rootDir });
  await execa('git', ['commit', '--no-verify', '-m', 'chore: initial scaffold'], {
    cwd: config.rootDir,
  });
}
