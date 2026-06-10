/**
 * /login — log in, or create an account (?mode=signup flips the form).
 *
 * Both forms post straight to server actions; errors/messages come back as
 * ?error= / ?message= query params. Zero client-side JavaScript.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signIn, signUp } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/user";

export const metadata: Metadata = { title: "Log in — grocery-app" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const isSignup = params.mode === "signup";

  // Already logged in? This page has nothing for you.
  if (await getCurrentUser()) redirect("/account");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isSignup
            ? "Save grocery lists and set your home postal code."
            : "Log in to your grocery-app account."}
        </p>
      </header>

      {/* Feedback from a previous attempt (set by the server actions) */}
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

      <form
        action={isSignup ? signUp : signIn}
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Password {isSignup && <span className="normal-case">(8+ characters)</span>}
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          {isSignup ? "Create account" : "Log in"}
        </button>
      </form>

      {/* Toggle between the two modes */}
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href="/login?mode=signup"
              className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
