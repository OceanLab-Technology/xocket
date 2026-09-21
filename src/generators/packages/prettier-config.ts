import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';

/**
 * Generates packages/prettier-config/.
 *
 * index.js uses `export default`, so the package must declare
 * `"type": "module"` — without it Node parsed the file as CommonJS and
 * resolving the config threw on older Node releases.
 */
export async function generatePrettierConfig(config: Config) {
  const pkgDir = path.join(config.rootDir, 'packages', 'prettier-config');
  await ensureDir(pkgDir);

  await writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(
      {
        name: '@xocket/prettier-config',
        version: '0.0.0',
        private: true,
        type: 'module',
        main: 'index.js',
        exports: { '.': './index.js' },
        files: ['index.js'],
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(pkgDir, 'index.js'),
    `/** @type {import('prettier').Config} */
export default {
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  semi: true,
  tabWidth: 2,
  useTabs: false,
}
`,
  );
}
