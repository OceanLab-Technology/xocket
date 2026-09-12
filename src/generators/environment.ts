import path from 'path';
import { readPkg, writePkg, addScript, addDevDeps } from '../utils/pkg.js';
import { writeFile } from '../utils/file.js';
import type { Config } from '../types.js';

/**
 * Generates environment files in apps/web.
 * Root .gitignore is handled by monorepo/gitignore.ts.
 */
export async function generateEnvironment(config: Config): Promise<void> {
  const { framework, backend, webDir } = config;

  // Variable prefix per framework convention
  const pfx = framework === 'react' ? 'VITE_' : 'NEXT_PUBLIC_';

  // Public env vars (browser-accessible)
  const publicVars: Record<string, string> = {
    [`${pfx}API_URL`]: 'http://localhost:3001/api',
    [`${pfx}SENTRY_DSN`]: '',
  };

  if (backend === 'supabase') {
    publicVars[`${pfx}SUPABASE_URL`] = 'https://your-project.supabase.co';
    publicVars[`${pfx}SUPABASE_ANON_KEY`] = 'your-supabase-anon-key';
  }

  if (backend === 'cognito') {
    publicVars[`${pfx}COGNITO_USER_POOL_ID`] = 'us-east-1_xxxxxxxxx';
    publicVars[`${pfx}COGNITO_CLIENT_ID`] = 'your-client-id';
    publicVars[`${pfx}COGNITO_REGION`] = 'us-east-1';
  }

  // Server-only vars (Next.js only — NOT prefixed with NEXT_PUBLIC_)
  const serverVars: Record<string, string> =
    framework === 'next'
      ? {
          SENTRY_DSN: '',
          SENTRY_ORG: 'your-org',
          SENTRY_PROJECT: 'your-project',
          '# SENTRY_AUTH_TOKEN': '# Required in CI/CD only — never commit this value',
          ...(backend === 'supabase'
            ? { SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key' }
            : {}),
        }
      : {};

  const renderEnv = (comment: string | null, includeServer = false) => {
    const lines = [];
    if (comment) lines.push(`# ${comment}`, '');
    lines.push('# Public variables (exposed to browser)');
    Object.entries(publicVars).forEach(([k, v]) => lines.push(`${k}=${v}`));
    if (includeServer && Object.keys(serverVars).length > 0) {
      lines.push('', '# Server-only — NEVER prefix these with NEXT_PUBLIC_');
      Object.entries(serverVars).forEach(([k, v]) => lines.push(`${k}=${v}`));
    }
    return lines.join('\n') + '\n';
  };

  await writeFile(
    path.join(webDir, '.env.example'),
    renderEnv(
      'Copy to .env.development / .env.staging / .env.production and fill in real values',
      true,
    ),
  );
  await writeFile(
    path.join(webDir, '.env.development'),
    renderEnv('Development', true),
  );
  await writeFile(path.join(webDir, '.env.staging'), renderEnv('Staging', true));
  await writeFile(
    path.join(webDir, '.env.production'),
    renderEnv('Production', true),
  );

  // Multi-environment scripts in apps/web/package.json
  let pkg = await readPkg(webDir);

  if (framework === 'react') {
    pkg = addScript(pkg, 'dev:staging', 'vite --mode staging');
    pkg = addScript(pkg, 'build:staging', 'vite build --mode staging');
    pkg = addScript(pkg, 'build:production', 'vite build --mode production');
  } else {
    // Next.js uses dotenv-cli for staging
    pkg = addDevDeps(pkg, { 'dotenv-cli': '^7.4.2' });
    pkg = addScript(
      pkg,
      'build:staging',
      'dotenv -e .env.staging -- next build',
    );
    pkg = addScript(pkg, 'build:production', 'next build');
  }

  await writePkg(webDir, pkg);
}
