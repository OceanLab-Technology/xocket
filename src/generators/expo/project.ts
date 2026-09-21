import type { Config } from '../../types.js';
import fs from 'fs-extra';
import path from 'path';
import { readPkg, writePkg } from '../../utils/pkg.js';
import { writeFile } from '../../utils/file.js';
import { templateDir, TEMPLATE_COPY_FILTER } from '../project.js';
import { DEPS } from '../../versions.js';

/**
 * Copies the Expo template into apps/expo and normalises its package.json.
 */
export async function generateExpoProject(config: Config, targetDir: string) {
  const { projectName } = config;

  await fs.copy(templateDir('expo'), targetDir, { filter: TEMPLATE_COPY_FILTER });

  // app.json carries the project's own name/slug/scheme.
  const appJsonPath = path.join(targetDir, 'app.json');
  const appJson = await fs.readJson(appJsonPath);
  appJson.expo.name = projectName;
  appJson.expo.slug = projectName;
  appJson.expo.scheme = projectName.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'app';
  await fs.writeJson(appJsonPath, appJson, { spaces: 2 });

  await writeFile(
    path.join(targetDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: ['expo/tsconfig.base', '@xocket/typescript-config/native.json'],
        compilerOptions: {
          paths: { '@/*': ['./src/*'] },
        },
        include: [
          '**/*.ts',
          '**/*.tsx',
          '.expo/types/**/*.ts',
          'expo-env.d.ts',
          'nativewind-env.d.ts',
        ],
        exclude: ['node_modules'],
      },
      null,
      2,
    ) + '\n',
  );

  const pkg = await readPkg(targetDir);
  pkg.name = `@${projectName}/expo`;
  pkg.version = '0.0.0';
  pkg.private = true;
  pkg.main = 'expo-router/entry';

  pkg.devDependencies = {
    ...(pkg.devDependencies ?? {}),
    '@xocket/typescript-config': 'workspace:*',
    '@xocket/eslint-config': 'workspace:*',
    '@xocket/prettier-config': 'workspace:*',
    typescript: DEPS.typescript,
    '@types/react': DEPS['@types/react'],
    eslint: DEPS.eslint,
  };

  pkg.scripts = {
    ...(pkg.scripts ?? {}),
    lint: 'eslint .',
    'type-check': 'tsc --noEmit',
    format: 'prettier --write .',
    'format:check': 'prettier --check .',
  };

  pkg.prettier = '@xocket/prettier-config';

  await writePkg(targetDir, pkg);

  // The Expo app previously got a `lint` script but no ESLint config at all,
  // so `turbo lint` failed at the root.
  await writeFile(
    path.join(targetDir, 'eslint.config.js'),
    `import nativeConfig from '@xocket/eslint-config/native.js'

export default [
  { ignores: ['.expo/**', 'expo-env.d.ts', 'nativewind-env.d.ts'] },
  ...nativeConfig,
]
`,
  );
}
