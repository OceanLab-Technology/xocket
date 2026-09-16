import type { Config } from '../types.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { readPkg, writePkg } from '../utils/pkg.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Copies the correct template to apps/web and sets up the app package.json.
 * TypeScript is mandatory — no language branching.
 */
export async function generateProject(config: Config) {
  const { projectName, framework, webDir } = config;
  const templateName = framework === 'next' ? 'next' : 'react';
  const templateDir = path.resolve(__dirname, '../../templates', templateName);

  await fs.copy(templateDir, webDir, {
    filter: (src) => !src.includes('node_modules') && !src.endsWith('package-lock.json') && !src.endsWith('.DS_Store'),
  });

  let pkg = await readPkg(webDir);
  pkg.name = `@${projectName}/web`;
  pkg.version = '0.0.0';
  pkg.private = true;
  pkg.type = 'module';

  // Workspace references to shared packages
  pkg.devDependencies = {
    ...(pkg.devDependencies || {}),
    '@xocket/typescript-config': 'workspace:*',
    '@xocket/eslint-config': 'workspace:*',
    '@xocket/prettier-config': 'workspace:*',
    typescript: '^5.5.3',
    '@types/react': '^18.3.3',
    '@types/react-dom': '^18.3.0',
    ...(framework === 'next' ? { '@types/node': '^22.0.0' } : {}),
  };

  // Standard scripts
  const lintScript =
    framework === 'next' ? 'next lint' : 'eslint . --ext .ts,.tsx';

  pkg.scripts = {
    ...(pkg.scripts || {}),
    lint: lintScript,
    'type-check': 'tsc --noEmit',
    format: 'prettier --write .',
    'format:check': 'prettier --check .',
  };

  // Prettier config reference
  pkg.prettier = '@xocket/prettier-config';

  await writePkg(webDir, pkg);
}
