import path from 'path';
import { readPkg, writePkg, addScript, addDevDeps } from '../utils/pkg.js';
import { writeFile } from '../utils/file.js';
import { envConvention } from '../utils/env.js';
import { deps } from '../versions.js';
import type { Config } from '../types.js';

/**
 * Writes the .env family for an app.
 *
 * Takes an explicit targetDir so the Expo app gets its own EXPO_PUBLIC_-prefixed
 * files — previously only apps/web ever received env files at all.
 */
export async function generateEnvironment(
  config: Config,
  targetDir: string = config.webDir,
): Promise<void> {
  const { framework, backend, target } = config;
  const { prefix } = envConvention(config);

  const publicVars: Record<string, string> = {
    [`${prefix}API_URL`]: 'http://localhost:3001/api',
    [`${prefix}SENTRY_DSN`]: '',
  };

  if (backend === 'supabase') {
    publicVars[`${prefix}SUPABASE_URL`] = 'https://your-project.supabase.co';
    publicVars[`${prefix}SUPABASE_ANON_KEY`] = 'your-supabase-anon-key';
  }

  if (backend === 'cognito') {
    publicVars[`${prefix}COGNITO_USER_POOL_ID`] = 'us-east-1_xxxxxxxxx';
    publicVars[`${prefix}COGNITO_CLIENT_ID`] = 'your-client-id';
    publicVars[`${prefix}COGNITO_REGION`] = 'us-east-1';
  }

  // Server-only vars exist for Next.js only; Vite and Metro ship every value
  // they can see to the client.
  const serverVars: Record<string, string> =
    framework === 'next' && target === 'web'
      ? {
          SENTRY_DSN: '',
          SENTRY_ORG: 'your-org',
          SENTRY_PROJECT: 'your-project',
          ...(backend === 'supabase' ? { SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key' } : {}),
        }
      : {};

  const render = (comment: string) => {
    const lines = [`# ${comment}`, ''];
    lines.push(`# Public — bundled into the client. Never put a secret here.`);
    for (const [k, v] of Object.entries(publicVars)) lines.push(`${k}=${v}`);

    if (Object.keys(serverVars).length > 0) {
      lines.push('', '# Server-only — never prefix these with NEXT_PUBLIC_.');
      for (const [k, v] of Object.entries(serverVars)) lines.push(`${k}=${v}`);
      lines.push(
        '',
        '# SENTRY_AUTH_TOKEN is required for source-map uploads.',
        '# Set it as a CI secret — do not commit a value.',
        '# SENTRY_AUTH_TOKEN=',
      );
    }
    return lines.join('\n') + '\n';
  };

  await writeFile(
    path.join(targetDir, '.env.example'),
    render('Copy to .env.development / .env.staging / .env.production and fill in real values'),
  );
  await writeFile(path.join(targetDir, '.env.development'), render('Development'));
  await writeFile(path.join(targetDir, '.env.staging'), render('Staging'));
  await writeFile(path.join(targetDir, '.env.production'), render('Production'));

  // Multi-environment scripts
  let pkg = await readPkg(targetDir);

  if (target === 'expo') {
    // Expo reads .env.<mode> via APP_ENV; no extra tooling needed.
    pkg = addScript(pkg, 'start:staging', 'APP_ENV=staging expo start');
  } else if (framework === 'react') {
    pkg = addScript(pkg, 'dev:staging', 'vite --mode staging');
    pkg = addScript(pkg, 'build:staging', 'vite build --mode staging');
    pkg = addScript(pkg, 'build:production', 'vite build --mode production');
  } else {
    pkg = addDevDeps(pkg, deps('dotenv-cli'));
    pkg = addScript(pkg, 'build:staging', 'dotenv -e .env.staging -- next build');
    pkg = addScript(pkg, 'build:production', 'next build');
  }

  await writePkg(targetDir, pkg);
}
