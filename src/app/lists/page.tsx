/**
 * /lists — the user's saved grocery lists. Each one can be re-priced with one
 * click (it just opens /list with the items pre-filled) or deleted.
 * Redirects to /login when signed out.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { deleteList } from "@/lib/lists/actions";
import { getCurrentUser } from "@/lib/auth/user";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My lists — grocery-app" };
export const dynamic = "force-dynamic";

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Load the user's lists and their items. RLS already scopes both queries to
  // the logged-in user — no .eq("user_id") needed (but it documents intent).
  const supabase = await createServerSupabaseClient();
  const { data: lists } = await supabase
    .from("grocery_lists")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listIds = (lists ?? []).map((l) => l.id);
  const { data: items } = listIds.length
    ? await supabase
        .from("grocery_list_items")
        .select("list_id, raw_text")
        .in("list_id", listIds)
    : { data: [] };

  // Group items under their list.
  const itemsByList = new Map<string, string[]>();
  for (const item of items ?? []) {
    const arr = itemsByList.get(item.list_id) ?? [];
    arr.push(item.raw_text);
    itemsByList.set(item.list_id, arr);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          My saved lists
        </h1>
        <Link
          href="/list"
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          + New list
        </Link>
      </header>

      {params.message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {params.message}
        </p>
      )}
      {params.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          {params.error}
        </p>
      )}

      {!lists || lists.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No saved lists yet. Price a list on the{" "}
          <Link href="/list" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            grocery list page
          </Link>{" "}
          and hit “Save”.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lists.map((list) => {
            const listItems = itemsByList.get(list.id) ?? [];
            // Re-pricing a list = opening /list with the items pre-filled.
            const openHref = `/list?items=${encodeURIComponent(listItems.join("\n"))}`;
            return (
              <li
                key={list.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {list.name}
                  </p>
                  <p className="truncate text-sm text-zinc-500">
                    {listItems.length} item{listItems.length === 1 ? "" : "s"}
                    {listItems.length > 0 && <> · {listItems.join(", ")}</>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={openHref}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Price it
                  </Link>
                  <form action={deleteList}>
                    <input type="hidden" name="list_id" value={list.id} />
                    <button
                      type="submit"
                      className="text-sm text-zinc-400 hover:text-rose-600"
                      aria-label={`Delete ${list.name}`}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
