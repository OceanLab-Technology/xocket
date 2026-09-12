import type { Config } from '../types.js';
import path from 'path';
import { writeFile } from '../utils/file.js';

/**
 * Generates tsconfig.json for apps/web, extending the shared @xocket/typescript-config.
 * TypeScript is mandatory — no conditional branching.
 * File renames are not needed because templates are now TypeScript-first (.tsx/.ts).
 */
export async function generateTypescript(config: Config) {
  const { framework, webDir } = config;

  if (framework === 'react') {
    await generateReactTs(webDir);
  } else {
    await generateNextTs(webDir);
  }
}

// ─── React / Vite ─────────────────────────────────────────────────────────────

async function generateReactTs(webDir: string) {
  // tsconfig.json — extends shared config
  await writeFile(
    path.join(webDir, 'tsconfig.json'),
    JSON.stringify({ extends: '@xocket/typescript-config/web.json' }, null, 2) + '\n',
  );

  // tsconfig.node.json — for vite.config.ts
  await writeFile(
    path.join(webDir, 'tsconfig.node.json'),
    JSON.stringify(
      {
        compilerOptions: {
          composite: true,
          skipLibCheck: true,
          module: 'ESNext',
          moduleResolution: 'bundler',
          allowSyntheticDefaultImports: true,
          strict: true,
        },
        include: ['vite.config.ts'],
      },
      null,
      2,
    ) + '\n',
  );

  // vite.config.ts — overwrite template version with @/* path alias
  await writeFile(
    path.join(webDir, 'vite.config.ts'),
    `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
`,
  );
}

// ─── Next.js App Router ───────────────────────────────────────────────────────

async function generateNextTs(webDir: string) {
  // tsconfig.json — extends shared config
  await writeFile(
    path.join(webDir, 'tsconfig.json'),
    JSON.stringify({ extends: '@xocket/typescript-config/next.json' }, null, 2) + '\n',
  );
}
