import { execa } from 'execa';

export const PM = 'pnpm';

/**
 * Run `pnpm install`.
 *
 * stderr is inherited so a failing install shows the real reason instead of a
 * truncated execa message.
 */
export async function install(cwd: string): Promise<void> {
  await execa(PM, ['install'], { cwd, stdio: ['ignore', 'pipe', 'inherit'] });
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
