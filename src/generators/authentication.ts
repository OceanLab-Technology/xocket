import type { Config } from '../types.js';
import path from 'path';
import { readPkg, writePkg, addDeps } from '../utils/pkg.js';
import { writeFile, ensureDir } from '../utils/file.js';

/**
 * Generates authentication/backend client setup in apps/web.
 * TypeScript only.
 *
 * Supabase + Next.js: browser / server / admin client split (Phase 6 SSR fix)
 * Supabase + React:   browser client only
 * Cognito:            Amplify.configure() wrapped for 'use client' boundary
 * Custom:             Axios-based auth service stubs
 */
export async function generateAuthentication(config: Config, targetDir: string) {
  const { backend, framework } = config;
  if (backend === 'none') return;

  const pfx = framework === 'react' ? 'import.meta.env.VITE_' : 'process.env.NEXT_PUBLIC_';

  if (backend === 'supabase') {
    await generateSupabase(config, pfx, targetDir);
  } else if (backend === 'cognito') {
    await generateCognito(config, pfx, targetDir);
  } else if (backend === 'custom') {
    await generateCustomAuth(targetDir);
  }
}

// ─── Supabase ─────────────────────────────────────────────────────────────────

async function generateSupabase(config: Config, pfx: string, targetDir: string) {
  const { framework } = config;
  let pkg = await readPkg(targetDir);

  if (framework === 'next') {
    // Next.js SSR: needs @supabase/ssr for server client
    pkg = addDeps(pkg, {
      '@supabase/supabase-js': '^2.45.4',
      '@supabase/ssr': '^0.5.1',
    });
    await writePkg(targetDir, pkg);

    const libDir = path.join(targetDir, 'src', 'lib', 'supabase');
    await ensureDir(libDir);

    // browser.ts — client-side component usage
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

// Singleton for client components
let browserClient: ReturnType<typeof createSupabaseBrowserClient> | undefined

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient()
  }
  return browserClient
}
`,
    );

    // server.ts — Server Components + Server Actions (uses cookies)
    await writeFile(
      path.join(libDir, 'server.ts'),
      `import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Use in Server Components, Server Actions, and Route Handlers.
 * Reads/writes session via Next.js cookies.
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Silently ignore in read-only Server Component contexts
          }
        },
      },
    },
  )
}
`,
    );

    // admin.ts — privileged operations (Route Handlers / scripts only)
    await writeFile(
      path.join(libDir, 'admin.ts'),
      `import { createClient } from '@supabase/supabase-js'

/**
 * Admin client with SERVICE_ROLE_KEY.
 *
 * ⚠️  NEVER import this in Client Components or pages.
 * ⚠️  NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * Use only in:
 *   - Route Handlers (app/api/...)
 *   - Server Actions
 *   - Node.js scripts
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

  } else {
    // React / Vite — single browser client is sufficient
    pkg = addDeps(pkg, { '@supabase/supabase-js': '^2.45.4' });
    await writePkg(targetDir, pkg);

    const libDir = path.join(targetDir, 'src', 'lib', 'supabase');
    await ensureDir(libDir);

    await writeFile(
      path.join(libDir, 'browser.ts'),
      `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = ${pfx}SUPABASE_URL as string
const supabaseAnonKey = ${pfx}SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
`,
    );
  }
}

// ─── Cognito / Amplify v6 ─────────────────────────────────────────────────────

async function generateCognito(config: Config, pfx: string, targetDir: string) {
  const { framework } = config;
  let pkg = await readPkg(targetDir);
  pkg = addDeps(pkg, { 'aws-amplify': '^6.6.3' });
  await writePkg(targetDir, pkg);

  const authDir = path.join(targetDir, 'src', 'lib', 'auth');
  await ensureDir(authDir);

  // Note: For Next.js, Amplify.configure() MUST be called inside a 'use client' component.
  // This is handled in wiring.js — Providers.tsx calls configureAmplify() on mount.
  await writeFile(
    path.join(authDir, 'cognito.ts'),
    `import { Amplify } from 'aws-amplify'
import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth'
import { getCurrentUser } from 'aws-amplify/auth'

/**
 * Configure Amplify once at application start.
 *
 * For React/Vite: call this before ReactDOM.createRoot() in main.tsx.
 * For Next.js: call this inside Providers.tsx ('use client' boundary),
 *              NOT in a Server Component or layout.tsx.
 */
export function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: ${pfx}COGNITO_USER_POOL_ID ?? '',
        userPoolClientId: ${pfx}COGNITO_CLIENT_ID ?? '',
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
  /**
   * Authenticate with your backend.
   * On success, store the token using tokenStorage.set(token).
   */
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload),

  /** Invalidate the current session on the backend. */
  logout: () => apiClient.post('/auth/logout'),

  /** Fetch the currently authenticated user's profile. */
  me: () => apiClient.get<Record<string, unknown>>('/auth/me'),

  /** Refresh the access token (if your backend supports it). */
  refresh: () => apiClient.post<AuthResponse>('/auth/refresh'),
}

/** localStorage token helpers — adapt to your session strategy. */
export const tokenStorage = {
  get: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  set: (token: string): void => {
    if (typeof window !== 'undefined') localStorage.setItem('token', token)
  },
  clear: (): void => {
    if (typeof window !== 'undefined') localStorage.removeItem('token')
  },
}
`,
  );
}
