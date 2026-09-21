/**
 * Single source of truth for every dependency version Xocket emits.
 *
 * Keeping these in one file means a stack refresh is a single-file diff and the
 * CI smoke matrix validates the whole set at once. Never inline a version range
 * in a generator — add it here instead.
 */
export const DEPS = {
  // ── React / web core ──────────────────────────────────────────────────────
  react: '^19.3.0',
  'react-dom': '^19.3.0',
  '@types/react': '^19.3.0',
  '@types/react-dom': '^19.2.0',

  // ── Next.js ───────────────────────────────────────────────────────────────
  next: '^16.3.5',
  'eslint-config-next': '^16.3.5',

  // ── Vite ──────────────────────────────────────────────────────────────────
  vite: '^8.3.0',
  '@vitejs/plugin-react': '^6.1.1',

  // ── Tailwind v4 (CSS-first: no tailwind.config.js, no autoprefixer) ───────
  tailwindcss: '^4.3.3',
  '@tailwindcss/vite': '^4.3.3',
  '@tailwindcss/postcss': '^4.3.3',
  'tw-animate-css': '^1.4.0',

  // ── shadcn/ui runtime ─────────────────────────────────────────────────────
  clsx: '^2.1.1',
  'tailwind-merge': '^3.7.0',
  'class-variance-authority': '^0.7.1',
  'lucide-react': '^1.47.0',

  // ── State ─────────────────────────────────────────────────────────────────
  zustand: '^5.0.15',
  '@reduxjs/toolkit': '^2.12.0',
  'react-redux': '^9.3.0',

  // ── Data ──────────────────────────────────────────────────────────────────
  axios: '^1.20.0',
  '@tanstack/react-query': '^5.103.1',

  // ── Backend / auth ────────────────────────────────────────────────────────
  '@supabase/supabase-js': '^2.116.0',
  '@supabase/ssr': '^0.12.7',
  'aws-amplify': '^6.20.0',

  // ── Observability ─────────────────────────────────────────────────────────
  '@sentry/react': '^10.75.0',
  '@sentry/nextjs': '^10.75.0',

  // ── Tooling ───────────────────────────────────────────────────────────────
  typescript: '^5.9.3',
  // ESLint 10 is ahead of the plugin ecosystem — eslint-plugin-react peers on
  // ^9.7 and crashes on 10. Track the maintained 9.x line until that lands.
  eslint: '^9.39.5',
  '@eslint/js': '^9.39.5',
  'typescript-eslint': '^8.70.0',
  'eslint-plugin-react': '^7.37.5',
  'eslint-plugin-react-hooks': '^7.1.1',
  globals: '^17.12.0',
  prettier: '^3.9.8',
  turbo: '^2.11.2',
  husky: '^9.1.7',
  'lint-staged': '^17.5.1',
  'dotenv-cli': '^11.0.0',

  // ── Expo / React Native ───────────────────────────────────────────────────
  expo: '~57.0.24',
  'expo-router': '~57.0.22',
  'expo-constants': '~57.0.19',
  'expo-linking': '~57.0.10',
  'expo-status-bar': '~57.0.1',
  'react-native': '0.87.1',
  'react-native-safe-area-context': '^5.10.0',
  'react-native-screens': '^4.28.0',
  'react-native-reanimated': '^4.7.0',
  nativewind: '^4.2.7',
  '@babel/core': '^7.26.0',

  // ── Node backend services ─────────────────────────────────────────────────
  hono: '^4.13.8',
  '@hono/node-server': '^2.1.1',
  tsup: '^8.5.1',
  tsx: '^4.20.6',
  '@types/node': '^26.6.2',
  zod: '^4.6.5',
} as const;

/** pnpm version pinned into the generated root package.json `packageManager` field. */
export const PNPM_VERSION = '10.20.0';

/** Minimum Node the generated project supports. */
export const NODE_ENGINE = '>=20.19.0';

export type DepName = keyof typeof DEPS;

/** Build a `{ name: range }` object for the given dependency names. */
export function deps(...names: DepName[]): Record<string, string> {
  return Object.fromEntries(names.map((n) => [n, DEPS[n]]));
}
