import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';

/**
 * Generates:
 *   <rootDir>/package.json          — root workspace package.json
 *   <rootDir>/pnpm-workspace.yaml   — workspace declaration
 *   <rootDir>/apps/                 — directory
 *   <rootDir>/packages/             — directory
 */
export async function generateWorkspace(config: Config) {
  const { rootDir, projectName } = config;

  await ensureDir(path.join(rootDir, 'apps'));
  await ensureDir(path.join(rootDir, 'packages'));

  const rootPkg = {
    name: projectName,
    version: '0.0.0',
    private: true,
    packageManager: 'pnpm@9.12.0',
    scripts: {
      dev: 'turbo dev',
      build: 'turbo build',
      lint: 'turbo lint',
      'type-check': 'turbo type-check',
      format: 'prettier --write .',
      'format:check': 'prettier --check .',
      prepare: 'husky',
    },
    devDependencies: {
      turbo: '^2.1.3',
      prettier: '^3.3.3',
      husky: '^9.1.5',
      'lint-staged': '^15.2.9',
    },
  };

  await writeFile(
    path.join(rootDir, 'package.json'),
    JSON.stringify(rootPkg, null, 2) + '\n',
  );

  await writeFile(
    path.join(rootDir, 'pnpm-workspace.yaml'),
    `packages:\n  - 'apps/*'\n  - 'packages/*'\n`,
  );
}
