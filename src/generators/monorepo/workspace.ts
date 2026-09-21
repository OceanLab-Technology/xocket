import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';
import { DEPS, PNPM_VERSION, NODE_ENGINE } from '../../versions.js';

/**
 * Generates the monorepo root: package.json, pnpm-workspace.yaml, .npmrc and
 * the apps/ + packages/ directories.
 *
 * The root now depends on the shared configs and on eslint itself. Previously
 * `.prettierrc` pointed at `@xocket/prettier-config` and the pre-commit hook
 * ran `eslint --fix`, but neither was resolvable from the root — so `pnpm
 * format` and every commit hook failed.
 */
export async function generateWorkspace(config: Config) {
  const { rootDir, projectName } = config;

  await ensureDir(path.join(rootDir, 'apps'));
  await ensureDir(path.join(rootDir, 'packages'));

  const rootPkg = {
    name: projectName,
    version: '0.0.0',
    private: true,
    type: 'module',
    packageManager: `pnpm@${PNPM_VERSION}`,
    engines: { node: NODE_ENGINE },
    scripts: {
      dev: 'turbo dev',
      build: 'turbo build',
      lint: 'turbo lint',
      'type-check': 'turbo type-check',
      test: 'turbo test',
      format: 'prettier --write .',
      'format:check': 'prettier --check .',
      prepare: 'husky',
    },
    devDependencies: {
      '@xocket/eslint-config': 'workspace:*',
      '@xocket/prettier-config': 'workspace:*',
      eslint: DEPS.eslint,
      prettier: DEPS.prettier,
      turbo: DEPS.turbo,
      husky: DEPS.husky,
      'lint-staged': DEPS['lint-staged'],
      typescript: DEPS.typescript,
    },
    prettier: '@xocket/prettier-config',
  };

  await writeFile(path.join(rootDir, 'package.json'), JSON.stringify(rootPkg, null, 2) + '\n');

  await writeFile(
    path.join(rootDir, 'pnpm-workspace.yaml'),
    `packages:
  - 'apps/*'
  - 'packages/*'
  - 'services/*'
`,
  );

  // Expo and several native modules resolve peers through hoisting.
  await writeFile(
    path.join(rootDir, '.npmrc'),
    `# Expo / React Native rely on a flatter tree than pnpm's default.
node-linker=hoisted
strict-peer-dependencies=false
auto-install-peers=true
`,
  );
}
