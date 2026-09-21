import type { Config } from '../types.js';
import path from 'path';
import { writeFile } from '../utils/file.js';
import { PNPM_VERSION } from '../versions.js';

/**
 * Generates the project's own CI workflow.
 *
 * Turborepo already fans tasks out across every workspace, including the
 * polyglot services, so a single job covers whatever the monorepo grows into.
 * Toolchains are installed conditionally based on which services exist.
 */
export async function generateCiWorkflow(config: Config) {
  const nodeMajor = '22';

  await writeFile(
    path.join(config.rootDir, '.github', 'workflows', 'ci.yml'),
    `name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v7
        with:
          # Turborepo compares against the base commit for affected-only runs.
          fetch-depth: 0

      - uses: pnpm/action-setup@v6
        with:
          version: ${PNPM_VERSION.split('.')[0]}

      - uses: actions/setup-node@v7
        with:
          node-version: ${nodeMajor}
          cache: pnpm

      # Uncomment whichever services/ languages this repo uses.
      # - uses: actions/setup-go@v7
      #   with: { go-version: '1.24' }
      # - uses: dtolnay/rust-toolchain@stable
      # - uses: astral-sh/setup-uv@v10

      - run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type-check
        run: pnpm type-check

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
        env:
          # Source-map upload needs a token; skipped on PRs from forks.
          SENTRY_AUTH_TOKEN: \${{ secrets.SENTRY_AUTH_TOKEN }}

      - name: Check formatting
        run: pnpm format:check
`,
  );

  await writeFile(
    path.join(config.rootDir, '.github', 'dependabot.yml'),
    `version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    groups:
      # One PR per ecosystem keeps the noise down and makes CI meaningful.
      react:
        patterns: ['react', 'react-dom', '@types/react', '@types/react-dom']
      dev-tooling:
        patterns: ['eslint*', '@eslint/*', 'prettier*', 'typescript', 'vitest', '@vitest/*']
      everything-else:
        patterns: ['*']
        exclude-patterns: ['react', 'react-dom', 'eslint*', 'typescript']

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: monthly
`,
  );
}
