import { createClient } from '@supabase/supabase-js';

/**
 * Admin client, authenticated with the service-role key.
 *
 * ⚠️  Never import this from a Client Component.
 * ⚠️  Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * Safe places: Route Handlers, Server Actions, Node scripts.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase admin env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
