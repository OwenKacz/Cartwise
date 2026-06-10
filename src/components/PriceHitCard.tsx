/**
 * One row in a results list: a product at a specific store, with its price.
 * Server component — pure display, no interactivity.
 */
import type { PriceHit } from "@/lib/search";
import { formatDistance } from "@/lib/geo";
import { formatMoney, formatUnitPrice, formatUpdated } from "@/components/format";

export function PriceHitCard({
  hit,
  highlight = false,
}: {
  hit: PriceHit;
  /** True for the cheapest row — gets the green "Cheapest" treatment. */
  highlight?: boolean;
}) {
  const onSale = hit.salePrice !== null;
  const unitPrice = formatUnitPrice(hit.unitPriceValue, hit.unitPriceUnit, hit.currency);

  return (
    <li
      className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${
        highlight
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      {/* Left side: what + where */}
      <div className="min-w-0">
        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
          {hit.productName}
          {hit.packageSize && (
            <span className="ml-2 text-sm font-normal text-zinc-500">
              {hit.packageSize}
            </span>
          )}
        </p>
        <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
          {hit.storeName}
          {hit.branchName ? ` · ${hit.branchName}` : ""} ·{" "}
          {formatDistance(hit.distanceKm)}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {formatUpdated(hit.lastUpdated)}
        </p>
      </div>

      {/* Right side: the price */}
      <div className="shrink-0 text-right">
        {highlight && (
          <span className="mb-1 inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Cheapest
          </span>
        )}
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {formatMoney(hit.effectivePrice, hit.currency)}
        </p>
        {onSale && (
          <p className="text-xs text-zinc-500">
            <span className="line-through">
              {formatMoney(hit.regularPrice, hit.currency)}
            </span>{" "}
            <span className="font-medium text-rose-600 dark:text-rose-400">sale</span>
          </p>
        )}
        {unitPrice && <p className="text-xs text-zinc-500">{unitPrice}</p>}
      </div>
    </li>
  );
}
