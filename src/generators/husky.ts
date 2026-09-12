import type { Config } from '../types.js';
import path from 'path';
import fs from 'fs-extra';
import { readPkg, writePkg } from '../utils/pkg.js';
import { writeFile, ensureDir } from '../utils/file.js';

/**
 * Configures Husky + lint-staged at the monorepo root.
 * The root package.json already has `prepare: "husky"` from workspace.js.
 * We add the lint-staged config and create the pre-commit hook.
 */
export async function generateHusky(config: Config) {
  const { rootDir } = config;

  // Add lint-staged config to root package.json
  let pkg = await readPkg(rootDir);
  pkg['lint-staged'] = {
    '**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
    '**/*.{json,css,md,yaml,yml}': ['prettier --write'],
  };
  await writePkg(rootDir, pkg);

  // Create .husky directory and pre-commit hook at root
  const huskyDir = path.join(rootDir, '.husky');
  await ensureDir(huskyDir);

  await writeFile(
    path.join(huskyDir, 'pre-commit'),
    `#!/bin/sh
npx lint-staged
`,
  );

  await fs.chmod(path.join(huskyDir, 'pre-commit'), 0o755);
}
