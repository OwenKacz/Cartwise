/**
 * Session refresh for the proxy layer (Next.js 16's `proxy.ts`, the renamed
 * middleware). This is the standard @supabase/ssr pattern:
 *
 * WHY THIS EXISTS:
 *   Supabase auth tokens expire after about an hour and are refreshed using a
 *   cookie. Server Components are NOT allowed to write cookies, so if nothing
 *   else refreshed the token, logged-in users would get silently logged out.
 *   The proxy runs before every matched request and CAN write cookies — so it
 *   is the one place that keeps sessions alive.
 *
 * The dance with `request.cookies` AND `response.cookies` looks redundant but
 * isn't: writing to the request keeps the *current* render seeing the fresh
 * token, writing to the response sends it back to the *browser* for next time.
 */
import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // If Supabase isn't configured (fresh clone, no .env.local yet), do nothing.
  if (!isSupabaseConfigured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          // Re-create the response so it carries the updated request cookies…
          response = NextResponse.next({ request });
          // …then also set them on the response for the browser.
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: this call is what actually triggers the token refresh.
  // Don't remove it, and don't put logic between client creation and here.
  await supabase.auth.getUser();

  return response;
}
