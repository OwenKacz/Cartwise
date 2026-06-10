/**
 * The site-wide top bar: brand + search links on the left, auth state on the
 * right ("Log in" when signed out; account + lists links when signed in).
 *
 * Server component — it checks the session on the server for every request,
 * so it's always correct without any client JavaScript.
 */
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/user";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <nav className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            grocery-app
          </Link>
          <Link
            href="/search"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Search
          </Link>
          <Link
            href="/list"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            List
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/lists"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                My lists
              </Link>
              <Link
                href="/account"
                className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
              >
                Account
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
