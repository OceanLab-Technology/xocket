import type { Config } from '../types.js';
import path from 'path';
import fs from 'fs-extra';
import { readPkg, writePkg, addDevDeps } from '../utils/pkg.js';
import { writeFile } from '../utils/file.js';
import { deps } from '../versions.js';

/**
 * Generates the app-level ESLint setup.
 *
 * Flat config for both frameworks on ESLint 10. The old React app shipped
 * `eslint . --ext .ts,.tsx` against ESLint 9 — `--ext` was removed in v9, so
 * `pnpm lint` could never have run.
 */
export async function generateEslint(config: Config) {
  const { framework, webDir } = config;

  let pkg = await readPkg(webDir);

  if (framework === 'react') {
    pkg = addDevDeps(pkg, deps('eslint'));
    await writePkg(webDir, pkg);

    await writeFile(
      path.join(webDir, 'eslint.config.js'),
      `// Extends the shared Xocket flat config for React + TypeScript.
import reactConfig from '@xocket/eslint-config/react.js'

export default reactConfig
`,
    );
  } else {
    pkg = addDevDeps(pkg, deps('eslint', 'eslint-config-next'));
    await writePkg(webDir, pkg);

    await writeFile(
      path.join(webDir, 'eslint.config.js'),
      `// eslint-config-next 16 ships native flat configs, so no FlatCompat shim.
import coreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import nextConfig from '@xocket/eslint-config/next.js'

const config = [
  { ignores: ['.next/**', 'next-env.d.ts'] },
  ...nextConfig,
  ...coreWebVitals,
  ...nextTypescript,
]

export default config
`,
    );

    // Remove the legacy rc file if an older scaffold left one behind.
    const legacy = path.join(webDir, '.eslintrc.json');
    if (await fs.pathExists(legacy)) await fs.remove(legacy);
  }
}
