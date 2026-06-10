/**
 * GET /auth/callback — where Supabase sends the browser back to after:
 *   - clicking the "confirm your email" link in a sign-up email, or
 *   - finishing an OAuth flow (Google sign-in, when we enable it in future).
 *
 * Supabase puts a one-time `?code=` in the URL; we exchange it for a real
 * session (cookies), then send the user on their way.
 */
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // Where to land after login — defaults to the account page.
  const next = url.searchParams.get("next") ?? "/account";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // No code or the exchange failed — back to login with a friendly message.
  return NextResponse.redirect(
    new URL("/login?error=Could not confirm your sign-in. Please try again.", url.origin),
  );
}
