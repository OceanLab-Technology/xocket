import type { Config } from '../types.js';
import path from 'path';
import { readPkg, writePkg, addDevDeps, addScript } from '../utils/pkg.js';
import { writeFile, ensureDir } from '../utils/file.js';
import { DEPS } from '../versions.js';

/**
 * Wires Vitest + Testing Library into a web app.
 *
 * `turbo test` previously existed as a task with nothing behind it. Every app
 * now ships a runnable test setup and one real test, so the task is
 * meaningful from the first commit.
 */
export async function generateTesting(config: Config, targetDir: string) {
  const { framework, target } = config;
  const isExpo = target === 'expo';

  let pkg = await readPkg(targetDir);
  pkg = addDevDeps(pkg, {
    vitest: DEPS.vitest,
    '@vitest/coverage-v8': DEPS['@vitest/coverage-v8'],
    '@testing-library/react': DEPS['@testing-library/react'],
    '@testing-library/jest-dom': DEPS['@testing-library/jest-dom'],
    '@testing-library/user-event': DEPS['@testing-library/user-event'],
    jsdom: DEPS.jsdom,
    ...(framework === 'next' || isExpo ? { '@vitejs/plugin-react': DEPS['@vitejs/plugin-react'] } : {}),
  });
  pkg = addScript(pkg, 'test', 'vitest run');
  pkg = addScript(pkg, 'test:watch', 'vitest');
  pkg = addScript(pkg, 'test:coverage', 'vitest run --coverage');
  await writePkg(targetDir, pkg);

  // A standalone Vitest config: the app's vite.config.ts is a build config and
  // Next has none at all, so tests get their own.
  await writeFile(
    path.join(targetDir, 'vitest.config.ts'),
    `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: ['src/test/**', '**/*.d.ts', '**/*.config.*'],
    },
  },
})
`,
  );

  await ensureDir(path.join(targetDir, 'src', 'test'));
  await writeFile(
    path.join(targetDir, 'src', 'test', 'setup.ts'),
    `import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library does not auto-clean when globals are enabled this way.
afterEach(() => {
  cleanup()
})
`,
  );

  // One real test, so `pnpm test` is green immediately and the pattern is clear.
  const componentPath = isExpo ? '../../app/index' : framework === 'next' ? '@/app/page' : '../App';
  const componentName = isExpo || framework === 'next' ? 'Page' : 'App';

  await writeFile(
    path.join(targetDir, 'src', 'test', 'smoke.test.tsx'),
    `import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ${componentName} from '${componentPath}'

describe('${componentName}', () => {
  it('renders the welcome heading', () => {
    render(<${componentName} />)
    expect(screen.getByRole('heading', { name: /welcome to xocket/i })).toBeInTheDocument()
  })
})
`,
  );
}
