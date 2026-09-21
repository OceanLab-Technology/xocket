import type { Config } from '../types.js';
import path from 'path';
import { writeFile } from '../utils/file.js';

/**
 * Generates apps/web/tsconfig.json.
 *
 * `include`/`exclude`/`paths` are declared HERE, not in the shared package, so
 * that TypeScript resolves them against the app directory. See the comment in
 * generators/packages/typescript-config.ts for why.
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
  await writeFile(
    path.join(webDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '@xocket/typescript-config/web.json',
        compilerOptions: {
          // Relative to THIS file. No baseUrl — removed in TypeScript 7.
          paths: { '@/*': ['./src/*'] },
        },
        include: ['src', 'vite.config.ts'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(webDir, 'vite.config.ts'),
    `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
  await writeFile(
    path.join(webDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '@xocket/typescript-config/next.json',
        compilerOptions: {
          paths: { '@/*': ['./src/*'] },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules'],
      },
      null,
      2,
    ) + '\n',
  );
}
