import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// NOTE: Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`
// (exporting `proxy` instead of `middleware`). This file is the direct
// replacement — see node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/proxy.md if this ever needs revisiting.

/**
 * Runs on every request to the (internal) tool. Refreshes the Supabase
 * auth session (required so server components always see a valid token)
 * and redirects signed-out visitors to /login.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // /unsubscribe is public on purpose — the people clicking it are studio
  // owners who received a cold email, not signed-in users. /api/chat-widget
  // and /widget.js are public for the same reason — the chat widget runs
  // on a studio's own website, visited by anonymous leads. (The internal
  // preview page that embeds it for Chris to try, /widget-preview, is
  // NOT listed here — it stays behind the normal auth gate.)
  const isPublicPath =
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/unsubscribe") ||
    path.startsWith("/api/chat-widget") ||
    path === "/widget.js";

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and image optimization files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
