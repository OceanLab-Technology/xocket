import type { Config } from '../types.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { readPkg, writePkg } from '../utils/pkg.js';
import { DEPS } from '../versions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Files that must never be copied out of a template directory. */
export const TEMPLATE_COPY_FILTER = (src: string): boolean =>
  !src.includes('node_modules') &&
  !src.endsWith('package-lock.json') &&
  !src.endsWith('pnpm-lock.yaml') &&
  !src.endsWith('.DS_Store');

/** Resolve a template directory for both `tsx src/` and the published build. */
export function templateDir(name: string): string {
  for (const up of ['../../templates', '../../../templates']) {
    const dir = path.resolve(__dirname, up, name);
    if (fs.existsSync(dir)) return dir;
  }
  throw new Error(`Template "${name}" not found. Is the package installed correctly?`);
}

/**
 * Copies the framework template into apps/web and normalises its package.json.
 */
export async function generateProject(config: Config) {
  const { projectName, framework, webDir } = config;

  await fs.copy(templateDir(framework === 'next' ? 'next' : 'react'), webDir, {
    filter: TEMPLATE_COPY_FILTER,
  });

  const pkg = await readPkg(webDir);
  pkg.name = `@${projectName}/web`;
  pkg.version = '0.0.0';
  pkg.private = true;
  pkg.type = 'module';

  pkg.devDependencies = {
    ...(pkg.devDependencies ?? {}),
    '@xocket/typescript-config': 'workspace:*',
    '@xocket/eslint-config': 'workspace:*',
    '@xocket/prettier-config': 'workspace:*',
    typescript: DEPS.typescript,
    '@types/react': DEPS['@types/react'],
    '@types/react-dom': DEPS['@types/react-dom'],
    // Both frameworks need it: Next for server code, Vite for vite.config.ts.
    '@types/node': DEPS['@types/node'],
  };

  pkg.scripts = {
    ...(pkg.scripts ?? {}),
    // Flat config discovers files itself — `--ext` was removed in ESLint 9.
    lint: 'eslint .',
    'type-check': 'tsc --noEmit',
    format: 'prettier --write .',
    'format:check': 'prettier --check .',
  };

  pkg.prettier = '@xocket/prettier-config';

  await writePkg(webDir, pkg);
}
