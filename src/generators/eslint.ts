import type { Config } from '../types.js';
import path from 'path';
import { readPkg, writePkg, addDevDeps } from '../utils/pkg.js';
import { writeFile } from '../utils/file.js';

/**
 * Generates app-level ESLint config in apps/web.
 * React: eslint.config.js (flat config v9) importing from @xocket/eslint-config
 * Next.js: .eslintrc.json with eslint-config-next (v8 — most stable for Next 14)
 */
export async function generateEslint(config: Config) {
  const { framework, webDir } = config;

  let pkg = await readPkg(webDir);

  if (framework === 'react') {
    pkg = addDevDeps(pkg, {
      eslint: '^9.9.0',
    });
    await writePkg(webDir, pkg);

    await writeFile(
      path.join(webDir, 'eslint.config.js'),
      `// Extends the shared Xocket ESLint config for React + TypeScript
import reactConfig from '@xocket/eslint-config/react.js'
export default reactConfig
`,
    );
  } else {
    pkg = addDevDeps(pkg, {
      eslint: '^8.57.0',
      'eslint-config-next': '^14.2.5',
    });
    await writePkg(webDir, pkg);

    await writeFile(
      path.join(webDir, '.eslintrc.json'),
      JSON.stringify(
        {
          extends: ['next/core-web-vitals', 'next/typescript'],
          rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'warn',
          },
        },
        null,
        2,
      ) + '\n',
    );
  }
}
