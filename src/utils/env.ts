import type { Config } from '../types.js';

/**
 * Public-env conventions per build target.
 *
 * The Expo app used to inherit the web app's config verbatim, so it was handed
 * `process.env.NEXT_PUBLIC_API_URL` or `import.meta.env.VITE_SUPABASE_URL` —
 * neither of which exists under Metro. Target is now explicit.
 */
export interface EnvConvention {
  /** Prefix that marks a variable as client-readable. */
  prefix: string;
  /** Source expression for a variable, given its unprefixed name. */
  read: (name: string) => string;
  /** True when the runtime exposes `import.meta.env` rather than `process.env`. */
  usesImportMeta: boolean;
}

export function envConvention(config: Pick<Config, 'framework' | 'target'>): EnvConvention {
  if (config.target === 'expo') {
    return {
      prefix: 'EXPO_PUBLIC_',
      read: (name) => `process.env.EXPO_PUBLIC_${name}`,
      usesImportMeta: false,
    };
  }

  if (config.framework === 'next') {
    return {
      prefix: 'NEXT_PUBLIC_',
      read: (name) => `process.env.NEXT_PUBLIC_${name}`,
      usesImportMeta: false,
    };
  }

  return {
    prefix: 'VITE_',
    read: (name) => `import.meta.env.VITE_${name}`,
    usesImportMeta: true,
  };
}
