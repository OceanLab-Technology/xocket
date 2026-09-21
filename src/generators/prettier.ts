import type { Config } from '../types.js';
import path from 'path';
import { writeFile } from '../utils/file.js';

/**
 * Root Prettier wiring. The config object itself lives in
 * packages/prettier-config, which the root package.json now depends on.
 */
export async function generatePrettier(config: Config) {
  const { rootDir } = config;

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
target
bin
coverage

# Env files
.env*

# Lock files
pnpm-lock.yaml
Cargo.lock
poetry.lock
go.sum

# Generated — these are written by a build, not by hand
*.lock
.xocket
next-env.d.ts
expo-env.d.ts
nativewind-env.d.ts
.expo
`,
  );
}
