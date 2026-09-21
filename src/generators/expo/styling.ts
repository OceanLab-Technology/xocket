import path from 'path';
import { readPkg, writePkg, addDeps, addDevDeps } from '../../utils/pkg.js';
import { writeFile } from '../../utils/file.js';
import { deps } from '../../versions.js';

/**
 * NativeWind 4 + Metro, configured for a pnpm workspace.
 *
 * NativeWind still uses Tailwind v3-style config — it has no v4 CSS-first
 * equivalent — so this app keeps a tailwind.config.js while the web app does
 * not. The metro config is written once here (it needs `withNativeWind`), which
 * is why the separate metro generator is gone.
 */
export async function generateExpoStyling(targetDir: string) {
  let pkg = await readPkg(targetDir);
  pkg = addDeps(pkg, deps('nativewind', 'react-native-reanimated'));
  pkg = addDevDeps(pkg, { tailwindcss: '^3.4.17' });
  await writePkg(targetDir, pkg);

  await writeFile(
    path.join(targetDir, 'tailwind.config.js'),
    `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: {} },
  plugins: [],
}
`,
  );

  await writeFile(
    path.join(targetDir, 'global.css'),
    `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
  );

  await writeFile(
    path.join(targetDir, 'metro.config.js'),
    `const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('node:path')

const projectRoot = __dirname
// apps/expo → monorepo root
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch the whole workspace so shared packages hot-reload.
config.watchFolders = [workspaceRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

config.resolver.disableHierarchicalLookup = true

module.exports = withNativeWind(config, { input: './global.css' })
`,
  );

  await writeFile(
    path.join(targetDir, 'babel.config.js'),
    `module.exports = function (api) {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  }
}
`,
  );

  // NativeWind's className prop needs its ambient types loaded.
  await writeFile(
    path.join(targetDir, 'nativewind-env.d.ts'),
    `/// <reference types="nativewind/types" />
`,
  );
}
