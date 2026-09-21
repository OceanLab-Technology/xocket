import type { Config } from '../types.js';
import path from 'path';
import fs from 'fs-extra';
import { readPkg, writePkg, addDevDeps } from '../utils/pkg.js';
import { writeFile } from '../utils/file.js';
import { deps } from '../versions.js';
import { SHADCN_THEME_CSS } from './web/theme.js';

/**
 * Configures Tailwind CSS v4 for apps/web.
 *
 * v4 is CSS-first: there is no tailwind.config.js, no PostCSS plugin chain for
 * Vite, and no autoprefixer (it is built in). Content paths are auto-detected,
 * so the previous `content: [...]` globs are gone too.
 *
 * The old generator emitted a `tailwind.config.js` containing a top-level
 * `await import('tailwindcss-animate')`; Tailwind's config loader transpiles to
 * CJS, so that file threw "Unexpected identifier 'Promise'" and no styles were
 * ever produced.
 */
export async function generateStyling(config: Config) {
  const { framework, webDir } = config;

  let pkg = await readPkg(webDir);

  if (framework === 'react') {
    // The Vite plugin replaces the whole postcss pipeline.
    pkg = addDevDeps(pkg, deps('tailwindcss', '@tailwindcss/vite'));
  } else {
    // Next still goes through PostCSS, but with a single plugin.
    pkg = addDevDeps(pkg, deps('tailwindcss', '@tailwindcss/postcss'));
  }
  pkg = addDevDeps(pkg, deps('tw-animate-css'));
  await writePkg(webDir, pkg);

  if (framework === 'next') {
    await writeFile(
      path.join(webDir, 'postcss.config.mjs'),
      `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
`,
    );
  } else {
    // Vite handles Tailwind through the plugin; a stray postcss config would
    // only re-run the pipeline.
    const stale = path.join(webDir, 'postcss.config.js');
    if (await fs.pathExists(stale)) await fs.remove(stale);
  }

  // Remove any v3-era config a previous scaffold left behind.
  for (const stale of ['tailwind.config.js', 'tailwind.config.ts']) {
    const f = path.join(webDir, stale);
    if (await fs.pathExists(f)) await fs.remove(f);
  }

  const cssFile =
    framework === 'next'
      ? path.join(webDir, 'src', 'app', 'globals.css')
      : path.join(webDir, 'src', 'index.css');

  await writeFile(cssFile, SHADCN_THEME_CSS);
}
