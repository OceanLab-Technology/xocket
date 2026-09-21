import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';

/**
 * Generates packages/typescript-config/.
 *
 * These files carry compiler options ONLY. `include`, `exclude` and `paths`
 * stay in each app's own tsconfig, because TypeScript resolves relative paths
 * against the file that declares them — putting `include: ["src"]` here made it
 * resolve to packages/typescript-config/src, so `tsc` reported TS18003 "No
 * inputs were found" in every generated app.
 *
 * `baseUrl` is gone for the same class of reason (and is removed outright in
 * TypeScript 7); `paths` entries are relative to the app tsconfig instead.
 */
export async function generateTypescriptConfig(config: Config) {
  const pkgDir = path.join(config.rootDir, 'packages', 'typescript-config');
  await ensureDir(pkgDir);

  await writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(
      {
        name: '@xocket/typescript-config',
        version: '0.0.0',
        private: true,
        files: ['base.json', 'web.json', 'next.json', 'node.json', 'native.json'],
      },
      null,
      2,
    ) + '\n',
  );

  const base = {
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
      forceConsistentCasingInFileNames: true,
    },
  };

  await writeFile(path.join(pkgDir, 'base.json'), JSON.stringify(base, null, 2) + '\n');

  // web.json — Vite + React 19
  await writeFile(
    path.join(pkgDir, 'web.json'),
    JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/tsconfig',
        extends: './base.json',
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          verbatimModuleSyntax: true,
          noEmit: true,
          jsx: 'react-jsx',
          useDefineForClassFields: true,
        },
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
          target: 'ES2022',
          lib: ['DOM', 'DOM.Iterable', 'ESNext'],
          module: 'ESNext',
          moduleResolution: 'bundler',
          allowJs: true,
          noEmit: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
        },
      },
      null,
      2,
    ) + '\n',
  );

  // node.json — backend services (emits real output)
  await writeFile(
    path.join(pkgDir, 'node.json'),
    JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/tsconfig',
        extends: './base.json',
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2022'],
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          declaration: true,
          sourceMap: true,
        },
      },
      null,
      2,
    ) + '\n',
  );

  // native.json — Expo / React Native
  await writeFile(
    path.join(pkgDir, 'native.json'),
    JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/tsconfig',
        extends: './base.json',
        compilerOptions: {
          target: 'ESNext',
          lib: ['ESNext', 'DOM'],
          module: 'ESNext',
          moduleResolution: 'bundler',
          jsx: 'react-jsx',
          noEmit: true,
        },
      },
      null,
      2,
    ) + '\n',
  );
}
