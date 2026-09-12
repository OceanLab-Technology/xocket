import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';

/**
 * Generates packages/typescript-config/ with:
 *   package.json
 *   base.json    — strict TypeScript base
 *   web.json     — extends base, for Vite + React
 *   next.json    — extends base, for Next.js App Router
 */
export async function generateTypescriptConfig(config: Config) {
  const pkgDir = path.join(config.rootDir, 'packages', 'typescript-config');
  await ensureDir(pkgDir);

  // package.json
  await writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(
      {
        name: '@xocket/typescript-config',
        version: '0.0.0',
        private: true,
        files: ['base.json', 'web.json', 'next.json'],
      },
      null,
      2,
    ) + '\n',
  );

  // base.json
  await writeFile(
    path.join(pkgDir, 'base.json'),
    JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/tsconfig',
        compilerOptions: {
          strict: true,
          skipLibCheck: true,
          esModuleInterop: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
      },
      null,
      2,
    ) + '\n',
  );

  // web.json — Vite + React
  await writeFile(
    path.join(pkgDir, 'web.json'),
    JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/tsconfig',
        extends: './base.json',
        compilerOptions: {
          target: 'ES2020',
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          noEmit: true,
          jsx: 'react-jsx',
          useDefineForClassFields: true,
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] },
        },
        include: ['src'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2,
    ) + '\n',
  );

  // next.json — Next.js App Router
  await writeFile(
    path.join(pkgDir, 'next.json'),
    JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/tsconfig',
        extends: './base.json',
        compilerOptions: {
          target: 'ES2017',
          lib: ['dom', 'dom.iterable', 'esnext'],
          module: 'esnext',
          moduleResolution: 'bundler',
          allowJs: true,
          noEmit: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules'],
      },
      null,
      2,
    ) + '\n',
  );
}
