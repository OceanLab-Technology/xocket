import type { Config } from '../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../utils/file.js';
import { readPkg, writePkg, addDeps } from '../utils/pkg.js';
import { DEPS } from '../versions.js';

/**
 * Generates sign-in / sign-up screens wired to the project's chosen backend.
 *
 * The backend generators produce clients but no UI, so every project started
 * from the same blank page. These screens call the real client for the
 * selected backend rather than being a generic mock.
 */
export async function generateAuthUi(config: Config, targetDir: string = config.webDir) {
  const { backend, framework } = config;

  if (backend === 'none') {
    throw new Error(
      'This project has no backend configured, so there is nothing to sign in against.\n' +
        'Re-run `xocket create` with --backend, or wire up your own client first.',
    );
  }

  let pkg = await readPkg(targetDir);
  pkg = addDeps(pkg, {
    'react-hook-form': DEPS['react-hook-form'],
    zod: DEPS.zod,
    '@hookform/resolvers': DEPS['@hookform/resolvers'],
  });
  await writePkg(targetDir, pkg);

  await writeAuthClient(config, targetDir);
  await writeForms(config, targetDir);

  if (framework === 'next') {
    await writeNextRoutes(config, targetDir);
  } else {
    await writeViteRoutes(config, targetDir);
  }
}

/**
 * A single `signIn` / `signUp` / `signOut` surface over whichever backend is
 * configured, so the forms do not branch on it.
 */
async function writeAuthClient(config: Config, targetDir: string) {
  const dir = path.join(targetDir, 'src', 'lib', 'auth');
  await ensureDir(dir);

  const impl: Record<string, string> = {
    supabase: `import { ${config.framework === 'next' ? 'getSupabaseBrowserClient' : 'supabase'} } from '../supabase/browser'

${config.framework === 'next' ? 'const supabase = getSupabaseBrowserClient()\n' : ''}
export async function signIn({ email, password }: Credentials): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new AuthError(error.message)
  return { id: data.user.id, email: data.user.email ?? email }
}

export async function signUp({ email, password }: Credentials): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new AuthError(error.message)
  // With email confirmation on, there is no session until the link is clicked.
  return { id: data.user?.id ?? '', email: data.user?.email ?? email }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new AuthError(error.message)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser()
  return data.user ? { id: data.user.id, email: data.user.email ?? '' } : null
}`,

    cognito: `import { login, logout, getAuthUser } from './cognito'
import { signUp as amplifySignUp } from 'aws-amplify/auth'

export async function signIn({ email, password }: Credentials): Promise<AuthUser> {
  try {
    await login(email, password)
    const user = await getAuthUser()
    return { id: user.userId, email }
  } catch (error) {
    throw new AuthError(error instanceof Error ? error.message : 'Sign-in failed')
  }
}

export async function signUp({ email, password }: Credentials): Promise<AuthUser> {
  try {
    const result = await amplifySignUp({ username: email, password, options: { userAttributes: { email } } })
    return { id: result.userId ?? '', email }
  } catch (error) {
    throw new AuthError(error instanceof Error ? error.message : 'Sign-up failed')
  }
}

export async function signOut(): Promise<void> {
  await logout()
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const user = await getAuthUser()
    return { id: user.userId, email: user.username }
  } catch {
    return null
  }
}`,

    custom: `import { authApi } from '../../api/auth'
import { setToken } from '../../api/axios'

export async function signIn({ email, password }: Credentials): Promise<AuthUser> {
  try {
    const { data } = await authApi.login({ email, password })
    setToken(data.token)
    return { id: String(data.user.id ?? ''), email }
  } catch (error) {
    throw new AuthError(error instanceof Error ? error.message : 'Sign-in failed')
  }
}

export async function signUp({ email, password }: Credentials): Promise<AuthUser> {
  // Point this at your real registration endpoint.
  try {
    const { data } = await authApi.login({ email, password })
    setToken(data.token)
    return { id: String(data.user.id ?? ''), email }
  } catch (error) {
    throw new AuthError(error instanceof Error ? error.message : 'Sign-up failed')
  }
}

export async function signOut(): Promise<void> {
  await authApi.logout().catch(() => undefined)
  setToken(null)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await authApi.me()
    return { id: String(data.id ?? ''), email: String(data.email ?? '') }
  } catch {
    return null
  }
}`,
  };

  await writeFile(
    path.join(dir, 'client.ts'),
    `${config.framework === 'next' ? "'use client'\n\n" : ''}/**
 * One auth surface over the project's backend (${config.backend}).
 *
 * The forms import from here, so swapping backends means changing this file
 * only.
 */

export interface Credentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
}

/** Thrown for any auth failure, so callers do not need backend-specific types. */
export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

${impl[config.backend]}
`,
  );
}

async function writeForms(config: Config, targetDir: string) {
  const dir = path.join(targetDir, 'src', 'components', 'auth');
  await ensureDir(dir);

  await writeFile(
    path.join(dir, 'auth-form.tsx'),
    `${config.framework === 'next' ? "'use client'\n\n" : ''}import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthError, signIn, signUp, type AuthUser } from '@/lib/auth/client'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Passwords must be at least 8 characters.'),
})

type FormValues = z.infer<typeof schema>

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
  onSuccess?: (user: AuthUser) => void
  className?: string
}

export function AuthForm({ mode, onSuccess, className }: AuthFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const isSignUp = mode === 'sign-up'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setFormError(null)
    try {
      const user = await (isSignUp ? signUp(values) : signIn(values))
      onSuccess?.(user)
    } catch (error) {
      setFormError(
        error instanceof AuthError ? error.message : 'Something went wrong. Try again.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('w-full max-w-sm space-y-4', className)}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isSignUp ? 'Create an account' : 'Welcome back'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isSignUp ? 'Enter your details to get started.' : 'Sign in to continue.'}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
          {...register('email')}
        />
        {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          aria-invalid={Boolean(errors.password)}
          className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
          {...register('password')}
        />
        {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
      </div>

      {formError && (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 w-full rounded-md text-sm font-medium disabled:opacity-50"
      >
        {isSubmitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
      </button>
    </form>
  )
}
`,
  );
}

async function writeNextRoutes(config: Config, targetDir: string) {
  const appDir = path.join(targetDir, 'src', 'app');

  for (const [route, mode] of [
    ['sign-in', 'sign-in'],
    ['sign-up', 'sign-up'],
  ] as const) {
    await ensureDir(path.join(appDir, route));
    await writeFile(
      path.join(appDir, route, 'page.tsx'),
      `'use client'

import { useRouter } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'

export default function Page() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <AuthForm mode="${mode}" onSuccess={() => router.push('/')} />
    </main>
  )
}
`,
    );
  }

  await writeFile(
    path.join(targetDir, 'src', 'middleware.ts'),
    `import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/sign-in', '/sign-up']

/**
 * Route protection starter.
 *
 * This only checks for the presence of a session cookie — it does not verify
 * it. Validate the session in the page or Route Handler before trusting it.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  ${
    config.backend === 'supabase'
      ? `const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))`
      : `const hasSession = Boolean(request.cookies.get('token')?.value)`
  }

  if (!hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Skip static assets and the Next internals.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
`,
  );
}

async function writeViteRoutes(_config: Config, targetDir: string) {
  const dir = path.join(targetDir, 'src', 'pages');
  await ensureDir(dir);

  for (const [file, mode] of [
    ['sign-in.tsx', 'sign-in'],
    ['sign-up.tsx', 'sign-up'],
  ] as const) {
    await writeFile(
      path.join(dir, file),
      `import { AuthForm } from '@/components/auth/auth-form'

export default function ${mode === 'sign-in' ? 'SignIn' : 'SignUp'}Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <AuthForm mode="${mode}" onSuccess={() => { window.location.href = '/' }} />
    </main>
  )
}
`,
    );
  }

  await writeFile(
    path.join(dir, 'README.md'),
    `# Pages

This app has no router installed. Wire these screens up with your router of
choice — for example:

\`\`\`bash
pnpm add react-router
\`\`\`

\`\`\`tsx
import { createBrowserRouter } from 'react-router'
import SignInPage from './pages/sign-in'
import SignUpPage from './pages/sign-up'

export const router = createBrowserRouter([
  { path: '/sign-in', element: <SignInPage /> },
  { path: '/sign-up', element: <SignUpPage /> },
])
\`\`\`
`,
  );
}
