"use server";

/**
 * Server actions for authentication and the user's profile.
 *
 * HOW THESE WORK (the pattern used app-wide):
 *   - Each action is an async function the form posts to directly
 *     (<form action={signIn}>). It runs ON THE SERVER — passwords and tokens
 *     never touch our client-side code.
 *   - Success → redirect somewhere useful.
 *   - Failure → redirect back to the form with ?error=… in the URL, which the
 *     page displays. No client-side JavaScript needed.
 */
import { redirect } from "next/navigation";

import { publicEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Build a "/page?error=…" or "/page?message=…" redirect target. */
function withParam(path: string, key: "error" | "message", text: string): string {
  const params = new URLSearchParams({ [key]: text });
  return `${path}?${params}`;
}

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------
export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(withParam("/login", "error", "Email and password are both required."));
  }
  if (password.length < 8) {
    redirect(withParam("/login", "error", "Password must be at least 8 characters."));
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Where the "confirm your email" link lands (see /auth/callback).
      emailRedirectTo: `${publicEnv.siteUrl}/auth/callback`,
    },
  });

  if (error) {
    redirect(withParam("/login", "error", error.message));
  }

  // If email confirmation is ON in Supabase, there's no session yet — the user
  // must click the link we just emailed them. If it's OFF, they're logged in.
  if (!data.session) {
    redirect(
      withParam(
        "/login",
        "message",
        "Account created — check your email for a confirmation link, then log in.",
      ),
    );
  }
  redirect("/account");
}

// ---------------------------------------------------------------------------
// Log in
// ---------------------------------------------------------------------------
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase's message here is deliberately vague ("Invalid login
    // credentials") — good, it doesn't reveal whether the email exists.
    redirect(withParam("/login", "error", error.message));
  }
  redirect("/account");
}

// ---------------------------------------------------------------------------
// Log out
// ---------------------------------------------------------------------------
export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Update profile (display name + home postal code)
// ---------------------------------------------------------------------------
export async function updateProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const homePostalCode = String(formData.get("home_postal_code") ?? "")
    .trim()
    .toUpperCase();

  // RLS guarantees users can only update their own row — and the database
  // trigger from Phase 2 blocks any attempt to change role/subscription.
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      home_postal_code: homePostalCode || null,
    })
    .eq("id", user.id);

  if (error) {
    redirect(withParam("/account", "error", error.message));
  }
  redirect(withParam("/account", "message", "Profile saved."));
}
