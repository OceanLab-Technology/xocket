import { execa } from 'execa';

export const PM = 'pnpm';

/**
 * Run `pnpm install` in a project Xocket just generated or modified.
 *
 * `--no-frozen-lockfile` is required, not merely convenient: pnpm turns
 * `--frozen-lockfile` on by default whenever CI=true, and we always install
 * immediately after writing or editing package.json files. In a fresh project
 * there is no lockfile at all; after `xocket add`, the existing one is
 * deliberately out of date. Without this, both commands fail under CI with
 * ERR_PNPM_NO_LOCKFILE / ERR_PNPM_OUTDATED_LOCKFILE.
 *
 * This is not the same as a project's own CI running `--frozen-lockfile`
 * against a committed lockfile — that is still correct, and is what the
 * generated workflow does.
 */
export async function install(cwd: string): Promise<void> {
  await execa(PM, ['install', '--no-frozen-lockfile'], {
    cwd,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
}

export async function pmExec(args: string[], cwd: string): Promise<void> {
  await execa(PM, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] });
}

/**
 * Run the project's own Prettier over the freshly generated tree.
 *
 * Generators emit readable but not necessarily Prettier-identical output, and
 * the project ships a `format:check` script plus a pre-commit hook — so without
 * this, a brand-new project fails its own format check and the first commit
 * reformats every file.
 *
 * Requires dependencies to be installed; callers skip it when they skipped the
 * install. A formatting failure is never fatal.
 */
export async function formatProject(cwd: string): Promise<boolean> {
  try {
    await execa(PM, ['exec', 'prettier', '--write', '.', '--log-level', 'warn'], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}
