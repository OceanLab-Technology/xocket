import type { Config } from '../types.js';
import path from 'path';
import fs from 'fs-extra';
import { readPkg, writePkg, addDeps } from '../utils/pkg.js';
import { writeFile } from '../utils/file.js';
import { deps } from '../versions.js';

/**
 * Configures Sentry for the web app.
 *
 * Next.js: the previous generator wrote next.config.ts but left the template's
 * next.config.js in place. Next 14 could not read a .ts config at all, so it
 * loaded the empty .js one and Sentry was silently never applied — while the
 * summary screen still printed "✓ Sentry". Next 16 does support next.config.ts,
 * and the stale .js file is now removed.
 *
 * Sentry v8 config files (sentry.client/server/edge.config.ts) were replaced in
 * v9+ by `instrumentation.ts` / `instrumentation-client.ts`.
 */
export async function generateSentry(config: Config) {
  if (config.framework === 'react') {
    await generateReactSentry(config);
  } else {
    await generateNextSentry(config);
  }
}

// ─── React / Vite ────────────────────────────────────────────────────────────

async function generateReactSentry(config: Config) {
  const { webDir } = config;

  let pkg = await readPkg(webDir);
  pkg = addDeps(pkg, deps('@sentry/react'));
  await writePkg(webDir, pkg);

  await writeFile(
    path.join(webDir, 'src', 'lib', 'sentry.ts'),
    `import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN
const mode = import.meta.env.MODE ?? 'development'

Sentry.init({
  dsn,
  environment: mode,
  // No DSN, or running locally? Stay silent.
  enabled: mode !== 'development' && Boolean(dsn),
  tracesSampleRate: mode === 'production' ? 0.2 : 1.0,
  integrations: [Sentry.browserTracingIntegration()],
})
`,
  );

  // Typed import.meta.env for the Vite client.
  await writeFile(
    path.join(webDir, 'src', 'vite-env.d.ts'),
    `/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_COGNITO_USER_POOL_ID?: string
  readonly VITE_COGNITO_CLIENT_ID?: string
  readonly VITE_COGNITO_REGION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
`,
  );
}

// ─── Next.js App Router ───────────────────────────────────────────────────────

async function generateNextSentry(config: Config) {
  const { webDir } = config;

  let pkg = await readPkg(webDir);
  pkg = addDeps(pkg, deps('@sentry/nextjs'));
  await writePkg(webDir, pkg);

  // instrumentation-client.ts — replaces sentry.client.config.ts (Sentry v9+)
  await writeFile(
    path.join(webDir, 'instrumentation-client.ts'),
    `import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
`,
  );

  // instrumentation.ts — server + edge runtimes
  await writeFile(
    path.join(webDir, 'instrumentation.ts'),
    `import * as Sentry from '@sentry/nextjs'

export async function register() {
  const common = {
    // Server-side DSN — deliberately NOT the NEXT_PUBLIC_ one.
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init(common)
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(common)
  }
}

export const onRequestError = Sentry.captureRequestError
`,
  );

  // next.config.ts is authoritative from Next 15 onward — drop the template .js
  // and any sentry.*.config.ts files an older scaffold produced.
  for (const stale of [
    'next.config.js',
    'next.config.mjs',
    'sentry.client.config.ts',
    'sentry.server.config.ts',
    'sentry.edge.config.ts',
  ]) {
    const f = path.join(webDir, stale);
    if (await fs.pathExists(f)) await fs.remove(f);
  }

  await writeFile(
    path.join(webDir, 'next.config.ts'),
    `import type { NextConfig } from 'next'
// v10 moved this to the /config subpath; the bare import stops working in v11.
import { withSentryConfig } from '@sentry/nextjs/config'

const nextConfig: NextConfig = {
  // Your Next.js config here.
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Source-map uploads need an auth token; set it as a CI secret, never in git.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Skip source-map upload entirely when there is no token (local dev, CI smoke).
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
})
`,
  );
}
