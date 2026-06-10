/**
 * /search — single-item search: "milk near M5T 1T3", cheapest first.
 *
 * HOW IT WORKS:
 *   - The form submits with GET, so the search lives in the URL
 *     (e.g. /search?q=milk&loc=M5T+1T3&radius=10). Shareable, bookmarkable,
 *     back-button friendly — and zero client-side JavaScript.
 *   - This is a Server Component: it reads `searchParams` (async in Next 16),
 *     runs the search on the server, and renders the finished HTML.
 */
import type { Metadata } from "next";

import { searchItem } from "@/lib/search";
import { getCurrentProfile } from "@/lib/auth/user";
import { LocationFields } from "@/components/LocationFields";
import { ModeTabs } from "@/components/ModeTabs";
import { PriceHitCard } from "@/components/PriceHitCard";

export const metadata: Metadata = { title: "Search — grocery-app" };

// Prices change all the time — always render fresh, never cache this page.
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; loc?: string; radius?: string }>;
}) {
  // Next.js 16: searchParams must be awaited.
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const radiusKm = Number(params.radius) || 10;

  // No location typed? Fall back to the logged-in user's home postal code
  // (set on /account). Anonymous users just get the geocoder's default.
  let locationText = (params.loc ?? "").trim();
  if (!locationText) {
    const profile = await getCurrentProfile();
    locationText = profile?.home_postal_code ?? "";
  }

  // Only run a search once the user has actually submitted something.
  const result = query
    ? await searchItem(query, locationText, radiusKm)
    : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Find the cheapest…
        </h1>
        <ModeTabs active="search" />
      </header>

      {/* The search form (GET → this same page) */}
      <form action="/search" method="get" className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Item
          </span>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="e.g. milk, eggs, rotisserie chicken"
            autoFocus
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>

        <LocationFields defaultLocation={locationText} defaultRadius={radiusKm} />

        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {result && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {result.hits.length} result{result.hits.length === 1 ? "" : "s"} for
              “{result.query}”
            </h2>
            <span className="text-xs text-zinc-400">
              near {result.location.label} · {result.radiusKm} km
            </span>
          </div>

          {result.location.approximate && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Location is approximate (mock geocoder). Distances are estimates.
            </p>
          )}

          {result.hits.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              No matching items within {result.radiusKm} km. Try a wider radius
              or a different search term.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {result.hits.map((hit, i) => (
                <PriceHitCard
                  key={`${hit.productId}-${hit.branchId}`}
                  hit={hit}
                  highlight={i === 0}
                />
              ))}
            </ol>
          )}

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Prices are estimates for comparison, may have changed, and should be
            verified in-store. Not affiliated with any retailer.
          </p>
        </section>
      )}
    </main>
  );
}
