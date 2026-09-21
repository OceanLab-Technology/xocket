import { execa } from 'execa';
import { NODE_ENGINE } from '../versions.js';

export interface PreflightResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const MIN_NODE_MAJOR = 20;

async function has(bin: string, args: string[] = ['--version']): Promise<string | null> {
  try {
    const { stdout } = await execa(bin, args, { timeout: 10_000 });
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Verify the host has everything the scaffold needs *before* we create any
 * files. Previously a missing pnpm surfaced as a raw ENOENT halfway through
 * generation, and the cleanup handler then deleted the half-built project.
 */
export async function preflight({
  needsInstall = true,
  needsGit = true,
}: { needsInstall?: boolean; needsGit?: boolean } = {}): Promise<PreflightResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (Number.isFinite(nodeMajor) && nodeMajor < MIN_NODE_MAJOR) {
    errors.push(
      `Node ${process.versions.node} is too old — Xocket projects require Node ${NODE_ENGINE}.`,
    );
  }

  if (needsInstall) {
    const pnpm = await has('pnpm');
    if (!pnpm) {
      errors.push(
        'pnpm was not found on PATH.\n' +
          '  Install it with:  npm install -g pnpm\n' +
          '  …or re-run with --no-install and install dependencies yourself.',
      );
    } else {
      const major = Number(pnpm.replace(/^v/, '').split('.')[0]);
      if (Number.isFinite(major) && major < 9) {
        warnings.push(`pnpm ${pnpm} is older than the pnpm 9+ this template targets.`);
      }
    }
  }

  if (needsGit) {
    const git = await has('git');
    if (!git) {
      warnings.push('git was not found on PATH — skipping repository initialisation.');
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/** True when git is available; used to soft-skip git init rather than fail. */
export async function hasGit(): Promise<boolean> {
  return (await has('git')) !== null;
}
