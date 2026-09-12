import { execa } from 'execa';

export const PM = 'pnpm';

/**
 * Run `pnpm install` in the given directory.
 */
export async function install(cwd: string) {
  await execa(PM, ['install'], { cwd, stdio: 'pipe' });
}

/**
 * Run an arbitrary pnpm sub-command.
 */
export async function pmExec(args: string[], cwd: string) {
  await execa(PM, args, { cwd, stdio: 'pipe' });
}
