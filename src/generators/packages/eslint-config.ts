import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';

/**
 * Generates packages/eslint-config/ with:
 *   package.json
 *   react.js     — ESLint v9 flat config for React + TypeScript
 *   (Next.js apps use eslint-config-next directly)
 */
export async function generateEslintConfig(config: Config) {
  const pkgDir = path.join(config.rootDir, 'packages', 'eslint-config');
  await ensureDir(pkgDir);

  // package.json
  await writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(
      {
        name: '@xocket/eslint-config',
        version: '0.0.0',
        private: true,
        type: 'module',
        exports: {
          './react': './react.js',
        },
        dependencies: {
          '@eslint/js': '^9.9.0',
          'typescript-eslint': '^8.2.0',
          'eslint-plugin-react': '^7.35.0',
          'eslint-plugin-react-hooks': '^5.1.0-rc.0',
          globals: '^15.9.0',
        },
        peerDependencies: {
          eslint: '>=9.0.0',
        },
      },
      null,
      2,
    ) + '\n',
  );

  // react.js — ESLint v9 flat config for React + TypeScript projects
  await writeFile(
    path.join(pkgDir, 'react.js'),
    `import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'

/** @type {import('typescript-eslint').Config} */
export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.turbo'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
    },
  },
)
`,
  );
}
