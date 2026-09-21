import type { Config } from '../types.js';
import path from 'path';
import fs from 'fs-extra';
import { readPkg, writePkg } from '../utils/pkg.js';
import { writeFile, ensureDir } from '../utils/file.js';

/**
 * Husky + lint-staged at the monorepo root.
 *
 * lint-staged runs `eslint` and `prettier` from the root, which is why the root
 * package.json now carries both as devDependencies.
 */
export async function generateHusky(config: Config) {
  const { rootDir } = config;

  const pkg = await readPkg(rootDir);
  pkg['lint-staged'] = {
    '**/*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
    '**/*.{json,css,md,yaml,yml}': ['prettier --write'],
  };
  await writePkg(rootDir, pkg);

  const huskyDir = path.join(rootDir, '.husky');
  await ensureDir(huskyDir);

  // Husky v9 sources the hook itself — no shebang, no `husky.sh` boilerplate.
  await writeFile(path.join(huskyDir, 'pre-commit'), 'pnpm exec lint-staged\n');
  await fs.chmod(path.join(huskyDir, 'pre-commit'), 0o755);
}
