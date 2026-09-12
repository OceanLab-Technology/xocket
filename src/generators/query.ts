import type { Config } from '../types.js';
import path from 'path';
import { readPkg, writePkg, addDeps } from '../utils/pkg.js';
import { ensureDir } from '../utils/file.js';

/**
 * Installs TanStack Query and creates the hooks directory.
 * Provider wiring is handled by wiring.js.
 */
export async function generateQuery(config: Config, targetDir: string) {
  if (config.serverState !== 'tanstack') return;

  let pkg = await readPkg(targetDir);
  pkg = addDeps(pkg, { '@tanstack/react-query': '^5.56.2' });
  await writePkg(targetDir, pkg);

  // Create hooks/queries directory scaffold
  await ensureDir(path.join(targetDir, 'src', 'hooks', 'queries'));
}
