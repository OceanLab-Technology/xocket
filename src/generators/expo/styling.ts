import path from 'path';
import { readPkg, writePkg, addDeps, addDevDeps } from '../../utils/pkg.js';
import { writeFile } from '../../utils/file.js';

export async function generateStyling(targetDir: string) {
  let pkg = await readPkg(targetDir);
  pkg = addDeps(pkg, {
    nativewind: '^4.1.23',
    'react-native-reanimated': '~3.10.1',
    'react-native-safe-area-context': '4.10.5',
  });
  pkg = addDevDeps(pkg, {
    tailwindcss: '^3.4.10',
  });
  await writePkg(targetDir, pkg);

  await writeFile(
    path.join(targetDir, 'tailwind.config.js'),
    `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
  );

  await writeFile(
    path.join(targetDir, 'global.css'),
    `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`
  );

  // Metro config needs withNativeWind
  const metroConfigPath = path.join(targetDir, 'metro.config.js');
  const existingMetroConfig = `const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: './global.css' });
`;
  await writeFile(metroConfigPath, existingMetroConfig);

  // update babel config
  await writeFile(
    path.join(targetDir, 'babel.config.js'),
    `module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
`
  );
}
