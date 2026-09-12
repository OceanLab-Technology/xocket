import type { Config } from '../types.js';
import path from 'path';
import { readPkg, writePkg, addDeps, addDevDeps } from '../utils/pkg.js';
import { writeFile, ensureDir } from '../utils/file.js';

/**
 * Configures Sentry for the web app. Always runs.
 *
 * React/Vite:
 *   - Installs @sentry/react
 *   - Generates src/lib/sentry.ts  (initialized before app render in main.tsx via wiring.js)
 *
 * Next.js:
 *   - Installs @sentry/nextjs
 *   - Generates sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts
 *   - Writes next.config.ts (replaces next.config.js) wrapped with withSentryConfig
 */
export async function generateSentry(config: Config) {
  const { framework, webDir } = config;

  let pkg = await readPkg(webDir);

  if (framework === 'react') {
    await generateReactSentry(config, pkg);
  } else {
    await generateNextSentry(config, pkg);
  }
}

// ─── React / Vite ────────────────────────────────────────────────────────────

async function generateReactSentry(config: Config, pkg: any) {
  const { webDir } = config;

  pkg = addDeps(pkg, { '@sentry/react': '^8.28.0' });
  await writePkg(webDir, pkg);

  await ensureDir(path.join(webDir, 'src', 'lib'));

  await writeFile(
    path.join(webDir, 'src', 'lib', 'sentry.ts'),
    `import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
const mode = (import.meta.env.MODE as string) ?? 'development'

Sentry.init({
  dsn,
  environment: mode,
  // Disable Sentry in local development and when DSN is not set
  enabled: mode !== 'development' && !!dsn,
  tracesSampleRate: mode === 'production' ? 0.2 : 1.0,
  integrations: [Sentry.browserTracingIntegration()],
})
`,
  );
}

// ─── Next.js App Router ───────────────────────────────────────────────────────

async function generateNextSentry(config: Config, pkg: any) {
  const { webDir } = config;

  pkg = addDeps(pkg, { '@sentry/nextjs': '^8.28.0' });
  await writePkg(webDir, pkg);

  const clientConfig = `import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Only send events in production
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
})
`;

  const serverConfig = `import * as Sentry from '@sentry/nextjs'

Sentry.init({
  // Server-side DSN — do NOT use NEXT_PUBLIC_ prefix
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
})
`;

  const edgeConfig = `import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
})
`;

  await writeFile(path.join(webDir, 'sentry.client.config.ts'), clientConfig);
  await writeFile(path.join(webDir, 'sentry.server.config.ts'), serverConfig);
  await writeFile(path.join(webDir, 'sentry.edge.config.ts'), edgeConfig);

  // next.config.ts — replaces the .js template version
  await writeFile(
    path.join(webDir, 'next.config.ts'),
    `import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  // Your Next.js config here
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Auth token for source-map uploads — set as a CI/CD secret only
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Suppress Sentry CLI output during builds
  silent: !process.env.CI,
  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
})
`,
  );
}
