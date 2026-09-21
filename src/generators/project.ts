import type { Config } from '../types.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { readPkg, writePkg } from '../utils/pkg.js';
import { DEPS } from '../versions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Files that must never be copied out of a template directory.
 *
 * The check is made against the path *relative to the template root*. Testing
 * the absolute path meant that a globally installed CLI — which always lives
 * under .../lib/node_modules/xocket/ — matched the node_modules rule for every
 * file and copied nothing, so `npx xocket` produced an app directory with no
 * package.json in it.
 */
export function templateCopyFilter(templateRoot: string) {
  return (src: string): boolean => {
    const rel = path.relative(templateRoot, src);

    // The template root itself; fs-extra asks about it first.
    if (rel === '') return true;

    const segments = rel.split(path.sep);
    if (segments.includes('node_modules')) return false;

    const base = segments[segments.length - 1]!;
    return !['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', '.DS_Store'].includes(base);
  };
}

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

  const from = templateDir(framework === 'next' ? 'next' : 'react');
  await fs.copy(from, webDir, { filter: templateCopyFilter(from) });

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
