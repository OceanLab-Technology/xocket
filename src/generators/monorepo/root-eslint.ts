import type { Config } from '../../types.js';
import path from 'path';
import { writeFile } from '../../utils/file.js';

/**
 * Root eslint.config.js.
 *
 * lint-staged runs `eslint --fix` from the repository root, which needs a
 * resolvable config there. Workspaces bring their own, so this one only has to
 * cover loose root-level scripts.
 */
export async function generateRootEslint(config: Config) {
  await writeFile(
    path.join(config.rootDir, 'eslint.config.js'),
    `import base from '@xocket/eslint-config/base.js'

export default [
  {
    ignores: [
      'apps/**',
      'packages/**',
      'services/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/node_modules/**',
    ],
  },
  ...base,
]
`,
  );
}
