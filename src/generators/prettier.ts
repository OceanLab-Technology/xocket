import type { Config } from '../types.js';
import path from 'path';
import { writeFile } from '../utils/file.js';

/**
 * Generates root-level Prettier config.
 * The actual config is in packages/prettier-config.
 * Root .prettierrc just references it.
 */
export async function generatePrettier(config: Config) {
  const { rootDir } = config;

  // Root .prettierrc — extends shared config
  await writeFile(
    path.join(rootDir, '.prettierrc'),
    `"@xocket/prettier-config"\n`,
  );

  // Root .prettierignore
  await writeFile(
    path.join(rootDir, '.prettierignore'),
    `# Dependencies
node_modules
.pnpm-store

# Build outputs
dist
.next
out
build
.turbo

# Env files
.env*

# Lock files
pnpm-lock.yaml
yarn.lock
package-lock.json

# Generated
*.lock
`,
  );
}
