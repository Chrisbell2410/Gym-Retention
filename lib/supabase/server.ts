import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Reads/writes the auth session via Next.js's cookie store.
 *
 * NOTE: Server Components can't write cookies, so the `setAll` call below
 * will throw if invoked from one. That's expected and safe to ignore as
 * long as `proxy.ts` is refreshing the session on every request — see the
 * comment there.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
            // Called from a Server Component — ignore, proxy.ts handles refresh.
          }
        },
      },
    },
  );
}

/**
 * Admin client for trusted server-only operations (e.g. background jobs,
 * webhooks) that need to bypass Row Level Security. NEVER import this into
 * anything that runs in the browser, and never pass user-controlled input
 * straight through without validation — this key owns the whole database.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
