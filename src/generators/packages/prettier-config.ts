import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';

/**
 * Generates packages/prettier-config/ with:
 *   package.json
 *   index.js     — the shared Prettier config object
 */
export async function generatePrettierConfig(config: Config) {
  const pkgDir = path.join(config.rootDir, 'packages', 'prettier-config');
  await ensureDir(pkgDir);

  // package.json
  await writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(
      {
        name: '@xocket/prettier-config',
        version: '0.0.0',
        private: true,
        main: 'index.js',
        // This allows "prettier": "@xocket/prettier-config" in any package.json
        prettier: './index.js',
      },
      null,
      2,
    ) + '\n',
  );

  // index.js — the actual config
  await writeFile(
    path.join(pkgDir, 'index.js'),
    `/** @type {import('prettier').Config} */
const config = {
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  semi: true,
  tabWidth: 2,
  useTabs: false,
}

export default config
`,
  );
}
