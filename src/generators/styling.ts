import type { Config } from '../types.js';
import path from 'path';
import fs from 'fs-extra';
import { readPkg, writePkg, addDevDeps } from '../utils/pkg.js';
import { writeFile } from '../utils/file.js';

/**
 * Configures Tailwind CSS for apps/web. Always runs — Tailwind is a default.
 */
export async function generateStyling(config: Config) {
  const { framework, webDir } = config;

  let pkg = await readPkg(webDir);
  pkg = addDevDeps(pkg, {
    tailwindcss: '^3.4.10',
    postcss: '^8.4.45',
    autoprefixer: '^10.4.20',
  });
  await writePkg(webDir, pkg);

  // tailwind.config.js — content paths differ by framework
  const contentPaths =
    framework === 'next'
      ? `'./src/app/**/*.{ts,tsx,mdx}',\n    './src/components/**/*.{ts,tsx}'`
      : `'./index.html',\n    './src/**/*.{ts,tsx}'`;

  await writeFile(
    path.join(webDir, 'tailwind.config.js'),
    `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    ${contentPaths},
  ],
  theme: {
    extend: {
      // shadcn/ui design tokens — populated when you add components
    },
  },
  plugins: [
    // tailwindcss-animate is installed for shadcn animations
    (await import('tailwindcss-animate')).default,
  ],
}
`,
  );

  // postcss.config.js
  await writeFile(
    path.join(webDir, 'postcss.config.js'),
    `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`,
  );

  // Inject @tailwind directives into the existing global CSS file
  const cssFile =
    framework === 'next'
      ? path.join(webDir, 'src', 'app', 'globals.css')
      : path.join(webDir, 'src', 'index.css');

  const tailwindDirectives = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`;
  const existing = (await fs.pathExists(cssFile))
    ? await fs.readFile(cssFile, 'utf-8')
    : '';
  // Only prepend if directives are not already present
  if (!existing.includes('@tailwind base')) {
    await fs.writeFile(cssFile, tailwindDirectives + '\n' + existing, 'utf-8');
  }
}
