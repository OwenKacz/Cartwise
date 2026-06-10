/**
 * /account — the logged-in user's profile: display name, home postal code
 * (used as the default search location), subscription status, log out.
 * Redirects to /login when signed out.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOut, updateProfile } from "@/lib/auth/actions";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/user";

export const metadata: Metadata = { title: "Account — grocery-app" };
export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your account
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
      </header>

      {params.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          {params.error}
        </p>
      )}
      {params.message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {params.message}
        </p>
      )}

      {/* Subscription status (read-only — Stripe manages it in Phase 6) */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Plan</span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {profile?.subscription_status ?? "free"}
        </span>
      </div>

      {/* Profile form */}
      <form action={updateProfile} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Display name
          </span>
          <input
            type="text"
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            placeholder="e.g. Owen"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Home postal code
          </span>
          <input
            type="text"
            name="home_postal_code"
            defaultValue={profile?.home_postal_code ?? ""}
            placeholder="e.g. M5T 1T3"
            autoComplete="postal-code"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <span className="text-xs text-zinc-400">
            Searches will use this automatically when you leave location blank.
          </span>
        </label>

        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Save profile
        </button>
      </form>

      <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Link
          href="/lists"
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          My saved lists →
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
