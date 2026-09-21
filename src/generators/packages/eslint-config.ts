import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';
import { DEPS } from '../../versions.js';

/**
 * Generates packages/eslint-config/ as ESLint 9/10 flat configs.
 *
 * The exports map lists each entry point both with and without the `.js`
 * suffix. Declaring only `'./react'` while apps imported
 * `@xocket/eslint-config/react.js` made every generated `pnpm lint` fail with
 * ERR_PACKAGE_PATH_NOT_EXPORTED.
 */
export async function generateEslintConfig(config: Config) {
  const pkgDir = path.join(config.rootDir, 'packages', 'eslint-config');
  await ensureDir(pkgDir);

  const entries = ['base', 'react', 'next', 'native'];
  const exportsMap: Record<string, string> = { '.': './base.js' };
  for (const e of entries) {
    exportsMap[`./${e}`] = `./${e}.js`;
    exportsMap[`./${e}.js`] = `./${e}.js`;
  }

  await writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(
      {
        name: '@xocket/eslint-config',
        version: '0.0.0',
        private: true,
        type: 'module',
        exports: exportsMap,
        files: entries.map((e) => `${e}.js`),
        dependencies: {
          '@eslint/js': DEPS['@eslint/js'],
          'typescript-eslint': DEPS['typescript-eslint'],
          'eslint-plugin-react': DEPS['eslint-plugin-react'],
          'eslint-plugin-react-hooks': DEPS['eslint-plugin-react-hooks'],
          globals: DEPS.globals,
        },
        peerDependencies: {
          eslint: '>=9.0.0',
        },
      },
      null,
      2,
    ) + '\n',
  );

  // base.js — plain TypeScript, no React assumptions
  await writeFile(
    path.join(pkgDir, 'base.js'),
    `import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** Shared ignore list — every config in this package starts from it. */
export const ignores = [
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/node_modules/**',
  '**/.turbo/**',
  '**/coverage/**',
  '**/*.d.ts',
]

export default tseslint.config(
  { ignores },
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2024 },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
)
`,
  );

  // react.js — browser React, used by the Vite app
  await writeFile(
    path.join(pkgDir, 'react.js'),
    `import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import base, { ignores } from './base.js'

export default [
  { ignores },
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2024 },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // The React 19 JSX transform makes the old in-scope rules obsolete.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]
`,
  );

  // next.js — composes eslint-config-next, which the app supplies
  await writeFile(
    path.join(pkgDir, 'next.js'),
    `import react from './react.js'

/**
 * Next.js apps compose this with eslint-config-next in their own
 * eslint.config.js, so that plugin stays a dependency of the app rather than
 * of this shared package.
 */
export default [
  ...react,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Server Components legitimately read process.env at module scope.
      'no-process-env': 'off',
    },
  },
]
`,
  );

  // native.js — Expo / React Native
  await writeFile(
    path.join(pkgDir, 'native.js'),
    `import globals from 'globals'
import react from './react.js'

export default [
  ...react,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node, __DEV__: 'readonly' },
    },
    rules: {
      // React Native resolves these through Metro, not the browser.
      'no-undef': 'off',
    },
  },
  {
    // Metro and Babel load their configs as CommonJS; require() is correct
    // here and banning it would make the app unbuildable.
    files: ['**/*.config.js', '**/*.config.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
]
`,
  );
}
