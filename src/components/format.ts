/**
 * Tiny display-formatting helpers shared by the search pages.
 * Pure functions only — no React, no data fetching.
 */

/** "$4.49" — money in the row's own currency (CAD for everything so far). */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * The `unit_price_unit` column stores machine-y tokens (set by the adapters).
 * Map them to something a shopper would actually read.
 */
const UNIT_LABELS: Record<string, string> = {
  per_100g: "/100 g",
  per_litre: "/L",
  per_lb: "/lb",
  per_kg: "/kg",
  each: "each",
};

/** "$1.00 /100 g" — or empty string when there's no unit price to show. */
export function formatUnitPrice(
  value: number | null,
  unit: string | null,
  currency: string,
): string {
  if (value === null || unit === null) return "";
  const label = UNIT_LABELS[unit] ?? unit;
  return `${formatMoney(value, currency)} ${label}`;
}

/** "updated today" / "updated 3 days ago" — keeps the trust signal friendly. */
export function formatUpdated(isoTimestamp: string): string {
  const then = new Date(isoTimestamp).getTime();
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "updated today";
  if (days === 1) return "updated yesterday";
  return `updated ${days} days ago`;
}
