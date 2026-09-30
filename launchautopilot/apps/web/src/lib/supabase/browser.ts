'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | undefined;

/** Singleton for use inside Client Components. */
export function getSupabaseBrowserClient() {
  browserClient ??= createSupabaseBrowserClient();
  return browserClient;
}
