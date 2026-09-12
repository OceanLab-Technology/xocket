import type { Config } from '../../types.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { readPkg, writePkg } from '../../utils/pkg.js';
import { writeFile } from '../../utils/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Copies the expo template to apps/expo and sets up the package.json.
 */
export async function generateProject(config: Config, targetDir: string) {
  const { projectName } = config;
  const templateDir = path.resolve(__dirname, '../../../templates', 'expo');

  await fs.copy(templateDir, targetDir);

  await writeFile(
    path.join(targetDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: ['expo/tsconfig.base', '@xocket/typescript-config/base.json'],
        compilerOptions: {
          jsx: 'react-native',
        },
      },
      null,
      2,
    ) + '\n',
  );

  let pkg = await readPkg(targetDir);
  pkg.name = `@${projectName}/expo`;
  pkg.version = '0.0.0';
  pkg.private = true;
  pkg.main = 'expo-router/entry';

  // Workspace references to shared packages
  pkg.devDependencies = {
    ...(pkg.devDependencies || {}),
    '@xocket/typescript-config': 'workspace:*',
    '@xocket/eslint-config': 'workspace:*',
    '@xocket/prettier-config': 'workspace:*',
    typescript: '^5.3.3',
    '@types/react': '~18.2.79',
  };

  // Standard scripts
  pkg.scripts = {
    ...(pkg.scripts || {}),
    start: 'expo start',
    android: 'expo run:android',
    ios: 'expo run:ios',
    web: 'expo start --web',
    lint: 'eslint . --ext .ts,.tsx',
    'type-check': 'tsc --noEmit',
    format: 'prettier --write .',
    'format:check': 'prettier --check .',
  };

  // Prettier config reference
  pkg.prettier = '@xocket/prettier-config';

  await writePkg(targetDir, pkg);
}
