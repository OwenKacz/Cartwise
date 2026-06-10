/**
 * Small server-side helpers for "who is logged in?" questions.
 * Used by pages and server actions — never from browser code.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * The logged-in Supabase auth user, or null when signed out.
 * (`getUser()` validates the token against Supabase — the trustworthy check,
 * unlike reading the cookie's claims directly.)
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * The logged-in user's profile row (display name, home postal code, role,
 * subscription status…), or null when signed out.
 *
 * The profile row is auto-created by a database trigger at sign-up, so for a
 * logged-in user it should always exist.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
