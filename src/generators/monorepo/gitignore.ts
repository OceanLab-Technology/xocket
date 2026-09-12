import type { Config } from '../../types.js';
import path from 'path';
import { writeFile } from '../../utils/file.js';

/**
 * Generates <rootDir>/.gitignore at the monorepo root.
 */
export async function generateRootGitignore(config: Config) {
  const content = `# Dependencies
node_modules
.pnp
.pnp.js

# Build outputs
dist/
.next/
out/
build/
.turbo/

# Environment — only .env.example is committed
.env
.env.local
.env.development
.env.staging
.env.production

# pnpm
.pnpm-store/

# Misc
.DS_Store
*.pem
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Sentry
.sentryclirc

# Editor
.vscode/
.idea/
*.swp
*.swo
`;

  await writeFile(path.join(config.rootDir, '.gitignore'), content);
}
