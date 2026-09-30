import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * For Server Components, Server Actions and Route Handlers.
 * Reads and writes the session through Next.js cookies.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies; middleware refreshes the
            // session instead, so this is safe to ignore.
          }
        },
      },
    },
  );
}
