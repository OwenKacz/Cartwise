/**
 * /list — grocery-list mode: paste a whole list, get
 *   1. the cheapest option for each item,
 *   2. the "single-store basket" comparison (best one-stop shop),
 *   3. the mix-and-match total (cheapest item anywhere, if you'd store-hop).
 *
 * Same pattern as /search: a GET form into a Server Component, no client JS.
 * The list itself travels in the URL (?items=milk%0Aeggs…), which keeps
 * results shareable and the back button working.
 */
import type { Metadata } from "next";

import { searchList } from "@/lib/search";
import { formatDistance } from "@/lib/geo";
import { formatMoney } from "@/components/format";
import { LocationFields } from "@/components/LocationFields";
import { ModeTabs } from "@/components/ModeTabs";
import { PriceHitCard } from "@/components/PriceHitCard";

export const metadata: Metadata = { title: "Grocery list — grocery-app" };

// Prices change all the time — always render fresh, never cache this page.
export const dynamic = "force-dynamic";

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string; loc?: string; radius?: string }>;
}) {
  // Next.js 16: searchParams must be awaited.
  const params = await searchParams;
  const rawList = (params.items ?? "").trim();
  const locationText = (params.loc ?? "").trim();
  const radiusKm = Number(params.radius) || 10;

  const result = rawList
    ? await searchList(rawList, locationText, radiusKm)
    : null;

  // The currency for the totals row — taken from the first hit we can find
  // (every price is CAD today; this just avoids hard-coding it).
  const currency =
    result?.items.flatMap((i) => i.hits)[0]?.currency ?? "CAD";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Price a whole grocery list
        </h1>
        <ModeTabs active="list" />
      </header>

      {/* The list form */}
      <form action="/list" method="get" className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Your list — one item per line (commas work too)
          </span>
          <textarea
            name="items"
            defaultValue={rawList}
            placeholder={"milk\neggs\nbananas\nbread"}
            rows={5}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>

        <LocationFields defaultLocation={locationText} defaultRadius={radiusKm} />

        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Price my list
        </button>
      </form>

      {result && (
        <>
          {result.location.approximate && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Location is approximate (mock geocoder) — near{" "}
              {result.location.label}. Distances are estimates.
            </p>
          )}

          {/* 1. Single-store baskets: the headline comparison */}
          {result.baskets.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Best single store
              </h2>
              <ol className="flex flex-col gap-2">
                {result.baskets.map((basket, i) => (
                  <li
                    key={basket.branchId}
                    className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${
                      i === 0
                        ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
                        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {basket.storeName}
                        {basket.branchName ? ` · ${basket.branchName}` : ""}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {basket.itemsFound} of {basket.itemsTotal} items ·{" "}
                        {formatDistance(basket.distanceKm)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {i === 0 && (
                        <span className="mb-1 inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Best
                        </span>
                      )}
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        {formatMoney(basket.total, currency)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Mix-and-match floor (cheapest store for every item):{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {formatMoney(result.cheapestMixTotal, currency)}
                </strong>
              </p>
            </section>
          )}

          {/* 2. Item-by-item breakdown */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Item by item
            </h2>
            {result.items.map((item) => (
              <div key={item.query} className="flex flex-col gap-2">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                  “{item.query}”
                </h3>
                {item.hits.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700">
                    No match within {result.radiusKm} km.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {/* Show the top 3 per item to keep the page scannable. */}
                    {item.hits.slice(0, 3).map((hit, i) => (
                      <PriceHitCard
                        key={`${hit.productId}-${hit.branchId}`}
                        hit={hit}
                        highlight={i === 0}
                      />
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </section>

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Prices are estimates for comparison, may have changed, and should be
            verified in-store. Not affiliated with any retailer.
          </p>
        </>
      )}
    </main>
  );
}
