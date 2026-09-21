import type { Config } from '../types.js';
import path from 'path';
import { readPkg, writePkg, addDeps } from '../utils/pkg.js';
import { writeFile, ensureDir } from '../utils/file.js';
import { envConvention } from '../utils/env.js';
import { deps } from '../versions.js';

/**
 * Backend / auth client setup for the given app.
 *
 * Supabase + Next: browser / server / admin split via @supabase/ssr
 * Supabase + React or Expo: single client
 * Cognito: Amplify v6, configured behind a client boundary
 * Custom: Axios-based auth service stubs
 */
export async function generateAuthentication(config: Config, targetDir: string) {
  const { backend } = config;
  if (backend === 'none') return;

  if (backend === 'supabase') {
    await generateSupabase(config, targetDir);
  } else if (backend === 'cognito') {
    await generateCognito(config, targetDir);
  } else if (backend === 'custom') {
    await generateCustomAuth(targetDir);
  }
}

// ─── Supabase ─────────────────────────────────────────────────────────────────

async function generateSupabase(config: Config, targetDir: string) {
  const { framework, target } = config;
  const env = envConvention(config);
  const libDir = path.join(targetDir, 'src', 'lib', 'supabase');

  let pkg = await readPkg(targetDir);

  if (framework === 'next' && target === 'web') {
    pkg = addDeps(pkg, deps('@supabase/supabase-js', '@supabase/ssr'));
    await writePkg(targetDir, pkg);
    await ensureDir(libDir);

    await writeFile(
      path.join(libDir, 'browser.ts'),
      `'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | undefined

/** Singleton for use inside Client Components. */
export function getSupabaseBrowserClient() {
  browserClient ??= createSupabaseBrowserClient()
  return browserClient
}
`,
    );

    await writeFile(
      path.join(libDir, 'server.ts'),
      `import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * For Server Components, Server Actions and Route Handlers.
 * Reads and writes the session through Next.js cookies.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Components cannot set cookies; middleware refreshes the
            // session instead, so this is safe to ignore.
          }
        },
      },
    },
  )
}
`,
    );

    await writeFile(
      path.join(libDir, 'admin.ts'),
      `import { createClient } from '@supabase/supabase-js'

/**
 * Admin client, authenticated with the service-role key.
 *
 * ⚠️  Never import this from a Client Component.
 * ⚠️  Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * Safe places: Route Handlers, Server Actions, Node scripts.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase admin env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
`,
    );
    return;
  }

  // React (Vite) and Expo both use the plain browser client.
  pkg = addDeps(pkg, deps('@supabase/supabase-js'));
  await writePkg(targetDir, pkg);
  await ensureDir(libDir);

  await writeFile(
    path.join(libDir, 'browser.ts'),
    `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = ${env.read('SUPABASE_URL')}
const supabaseAnonKey = ${env.read('SUPABASE_ANON_KEY')}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set ${env.prefix}SUPABASE_URL and ${env.prefix}SUPABASE_ANON_KEY.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
`,
  );
}

// ─── Cognito / Amplify v6 ─────────────────────────────────────────────────────

async function generateCognito(config: Config, targetDir: string) {
  const env = envConvention(config);

  let pkg = await readPkg(targetDir);
  pkg = addDeps(pkg, deps('aws-amplify'));
  await writePkg(targetDir, pkg);

  const authDir = path.join(targetDir, 'src', 'lib', 'auth');
  await ensureDir(authDir);

  await writeFile(
    path.join(authDir, 'cognito.ts'),
    `import { Amplify } from 'aws-amplify'
import { fetchAuthSession, getCurrentUser, signIn, signOut } from 'aws-amplify/auth'

/**
 * Configure Amplify once, at application start.
 *
 * React (Vite): called from main.tsx before render.
 * Next.js:      called from Providers.tsx, inside the 'use client' boundary —
 *               never from a Server Component or layout.tsx.
 * Expo:         called from app/_layout.tsx.
 */
export function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: ${env.read('COGNITO_USER_POOL_ID')} ?? '',
        userPoolClientId: ${env.read('COGNITO_CLIENT_ID')} ?? '',
        loginWith: { email: true },
      },
    },
  })
}

export async function login(email: string, password: string) {
  return signIn({ username: email, password })
}

export async function logout() {
  return signOut()
}

export async function getAuthUser() {
  return getCurrentUser()
}

export async function getSession() {
  return fetchAuthSession()
}
`,
  );
}

// ─── Custom API ───────────────────────────────────────────────────────────────

async function generateCustomAuth(targetDir: string) {
  const apiDir = path.join(targetDir, 'src', 'api');
  await ensureDir(apiDir);

  await writeFile(
    path.join(apiDir, 'auth.ts'),
    `import { apiClient } from './axios'

interface LoginPayload {
  email: string
  password: string
}

interface AuthResponse {
  token: string
  user: Record<string, unknown>
}

export const authApi = {
  /** Authenticate against your backend. Store the returned token. */
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>('/auth/login', payload),

  /** Invalidate the current session server-side. */
  logout: () => apiClient.post('/auth/logout'),

  /** Fetch the authenticated user's profile. */
  me: () => apiClient.get<Record<string, unknown>>('/auth/me'),

  /** Exchange a refresh token for a new access token. */
  refresh: () => apiClient.post<AuthResponse>('/auth/refresh'),
}
`,
  );
}
