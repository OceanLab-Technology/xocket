import type { Config } from '../../types.js';
import path from 'path';
import { writeFile } from '../../utils/file.js';

/**
 * Generates <rootDir>/README.md with project structure and getting started docs.
 */
export async function generateReadme(config: Config) {
  const { projectName, framework } = config;
  const frameworkLabel = framework === 'react' ? 'React (Vite)' : 'Next.js (App Router)';

  const content = `# ${projectName}

A production-ready monorepo created with [Xocket](https://github.com/xocket).

## Stack

- **Framework:** ${frameworkLabel} · TypeScript · Tailwind CSS · shadcn/ui
- **Monorepo:** pnpm workspaces + Turborepo
- **Quality:** ESLint · Prettier · Husky · lint-staged
- **Error Tracking:** Sentry

## Structure

\`\`\`
${projectName}/
├── apps/
│   └── web/                # ${frameworkLabel} web application
│       ├── src/
│       │   ├── api/        # Axios client + services
│       │   ├── components/ # React components (ui/ for shadcn)
│       │   ├── hooks/      # Custom hooks
│       │   ├── lib/        # Shared utilities (sentry, supabase…)
│       │   └── store/      # State management
│       └── package.json
├── packages/
│   ├── typescript-config/  # Shared TypeScript configs
│   ├── eslint-config/      # Shared ESLint configs
│   └── prettier-config/    # Shared Prettier config
├── package.json            # Root workspace
├── pnpm-workspace.yaml
├── turbo.json
└── .xocket/config.json     # Xocket project manifest
\`\`\`

## Getting Started

\`\`\`bash
# Install all workspace dependencies
pnpm install

# Start development
pnpm dev

# Build all apps
pnpm build
\`\`\`

## Available Scripts

| Command | Description |
|---|---|
| \`pnpm dev\` | Start all development servers via Turborepo |
| \`pnpm build\` | Build all apps |
| \`pnpm lint\` | Lint all packages |
| \`pnpm type-check\` | TypeScript check across all packages |
| \`pnpm format\` | Format all files with Prettier |

## Adding Modules

\`\`\`bash
# Future: add an Expo mobile app to this monorepo
xocket add expo
\`\`\`
`;

  await writeFile(path.join(config.rootDir, 'README.md'), content);
}
