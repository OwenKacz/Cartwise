/**
 * The search engine (server-side only).
 *
 * This is the heart of Phase 4: given "what the user wants" + "where they are",
 * return matching products at nearby stores, cheapest first.
 *
 * HOW IT WORKS (deliberately simple, flat queries — no SQL joins to learn):
 *   1. Find products whose name/brand/category matches the search words.
 *   2. Load all in-stock prices for those products.
 *   3. Load the branches (locations) those prices belong to, and their stores.
 *   4. Stitch the pieces together in plain TypeScript, compute the distance to
 *      each branch, drop anything outside the radius, sort by price.
 *
 * Everything reads through the normal server Supabase client (the public key),
 * because the catalog tables are public-read under RLS. No admin key here.
 */
import { geocode, type GeocodeResult } from "@/lib/geocoder";
import { distanceKm } from "@/lib/geo";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Result shapes (what the UI receives)
// ---------------------------------------------------------------------------

/** One product-at-one-store row in the results list. */
export interface PriceHit {
  productId: string;
  productName: string;
  brand: string | null;
  category: string | null;
  packageSize: string | null;
  /** The price you'd actually pay: the sale price when there is one. */
  effectivePrice: number;
  regularPrice: number;
  salePrice: number | null;
  unitPriceValue: number | null;
  unitPriceUnit: string | null;
  currency: string;
  lastUpdated: string;
  branchId: string;
  branchName: string | null;
  address: string | null;
  city: string | null;
  storeName: string;
  distanceKm: number;
}

/** Result of a single-item search ("milk"). */
export interface ItemSearchResult {
  query: string;
  location: GeocodeResult;
  radiusKm: number;
  hits: PriceHit[];
}

/** One line of a grocery-list search ("milk\neggs\nbananas"). */
export interface ListItemResult {
  query: string;
  /** All matches, cheapest first (same as a single search). */
  hits: PriceHit[];
  /** Convenience: hits[0], the single cheapest option anywhere in radius. */
  cheapest: PriceHit | null;
}

/** "If I bought everything at ONE store, what would it cost?" */
export interface StoreBasket {
  branchId: string;
  storeName: string;
  branchName: string | null;
  distanceKm: number;
  /** How many of the list's items this store had at all. */
  itemsFound: number;
  itemsTotal: number;
  /** Sum of the cheapest in-store price for each item it carries. */
  total: number;
}

/** Result of a grocery-list search. */
export interface ListSearchResult {
  location: GeocodeResult;
  radiusKm: number;
  items: ListItemResult[];
  /** Sorted: most items found first, then cheapest total. */
  baskets: StoreBasket[];
  /** Sum of each item's overall-cheapest price (mix-and-match shopping). */
  cheapestMixTotal: number;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * PostgREST's `.or()` filter string treats commas and parentheses as syntax,
 * so we strip them from user input before building the filter. (Not a security
 * issue — Supabase parameterizes values — it just prevents broken queries.)
 */
function sanitizeTerm(term: string): string {
  return term.replace(/[(),%]/g, " ").trim();
}

/**
 * Core lookup shared by both search modes: find every in-stock price for
 * products matching `term`, within `radiusKm` of the user. Returns hits
 * sorted cheapest-first.
 */
async function findHits(
  term: string,
  userLat: number,
  userLng: number,
  radiusKm: number,
): Promise<PriceHit[]> {
  const supabase = await createServerSupabaseClient();
  const q = sanitizeTerm(term);
  if (!q) return [];

  // Step 1: products whose name OR brand OR category contains the term.
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, brand, category, package_size")
    .or(`name.ilike.%${q}%,brand.ilike.%${q}%,category.ilike.%${q}%`)
    .limit(50);
  if (productsError) throw productsError;
  if (!products || products.length === 0) return [];

  // Step 2: every in-stock price for those products.
  const productIds = products.map((p) => p.id);
  const { data: prices, error: pricesError } = await supabase
    .from("prices")
    .select(
      "product_id, branch_id, regular_price, sale_price, unit_price_value, unit_price_unit, currency, last_updated",
    )
    .in("product_id", productIds)
    .eq("in_stock", true);
  if (pricesError) throw pricesError;
  if (!prices || prices.length === 0) return [];

  // Step 3: the branches those prices live at, plus their parent stores.
  const branchIds = [...new Set(prices.map((p) => p.branch_id))];
  const { data: branches, error: branchesError } = await supabase
    .from("store_branches")
    .select("id, store_id, name, address, city, lat, lng")
    .in("id", branchIds);
  if (branchesError) throw branchesError;

  const storeIds = [...new Set((branches ?? []).map((b) => b.store_id))];
  const { data: stores, error: storesError } = await supabase
    .from("stores")
    .select("id, name")
    .in("id", storeIds);
  if (storesError) throw storesError;

  // Step 4: stitch together + distance filter + sort.
  const productById = new Map(products.map((p) => [p.id, p]));
  const branchById = new Map((branches ?? []).map((b) => [b.id, b]));
  const storeById = new Map((stores ?? []).map((s) => [s.id, s]));

  const hits: PriceHit[] = [];
  for (const price of prices) {
    const product = productById.get(price.product_id);
    const branch = branchById.get(price.branch_id);
    if (!product || !branch) continue; // shouldn't happen; defensive
    if (branch.lat === null || branch.lng === null) continue; // can't measure distance

    const dist = distanceKm(userLat, userLng, branch.lat, branch.lng);
    if (dist > radiusKm) continue;

    const store = storeById.get(branch.store_id);
    hits.push({
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      category: product.category,
      packageSize: product.package_size,
      effectivePrice: price.sale_price ?? price.regular_price,
      regularPrice: price.regular_price,
      salePrice: price.sale_price,
      unitPriceValue: price.unit_price_value,
      unitPriceUnit: price.unit_price_unit,
      currency: price.currency,
      lastUpdated: price.last_updated,
      branchId: branch.id,
      branchName: branch.name,
      address: branch.address,
      city: branch.city,
      storeName: store?.name ?? "Unknown store",
      distanceKm: dist,
    });
  }

  // Cheapest first; break price ties by closeness.
  hits.sort(
    (a, b) => a.effectivePrice - b.effectivePrice || a.distanceKm - b.distanceKm,
  );
  return hits;
}

// ---------------------------------------------------------------------------
// Public API (called from the pages)
// ---------------------------------------------------------------------------

/** Single-item search: "milk near M5T 1T3 within 10 km". */
export async function searchItem(
  query: string,
  locationText: string,
  radiusKm: number,
): Promise<ItemSearchResult> {
  const location = await geocode(locationText);
  const hits = await findHits(query, location.lat, location.lng, radiusKm);
  return { query, location, radiusKm, hits };
}

/**
 * Grocery-list search: one search per line, plus the "single-store basket"
 * comparison (what each store would charge for as much of the list as it has).
 */
export async function searchList(
  rawList: string,
  locationText: string,
  radiusKm: number,
): Promise<ListSearchResult> {
  const location = await geocode(locationText);

  // Split the textarea into clean, de-duplicated item terms.
  const terms = [
    ...new Set(
      rawList
        .split(/[\n,]+/) // newlines or commas both work
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    ),
  ].slice(0, 30); // sanity cap so a pasted essay doesn't fire 500 queries

  // One search per item (sequential keeps it simple; lists are short).
  const items: ListItemResult[] = [];
  for (const term of terms) {
    const hits = await findHits(term, location.lat, location.lng, radiusKm);
    items.push({ query: term, hits, cheapest: hits[0] ?? null });
  }

  // Build the per-store baskets: for every branch that appeared anywhere,
  // take its cheapest price for each item it carries and add them up.
  const basketByBranch = new Map<string, StoreBasket>();
  for (const item of items) {
    // Cheapest price per branch FOR THIS ITEM (hits are already sorted, so the
    // first hit we see for a branch is its cheapest).
    const seenBranches = new Set<string>();
    for (const hit of item.hits) {
      if (seenBranches.has(hit.branchId)) continue;
      seenBranches.add(hit.branchId);

      let basket = basketByBranch.get(hit.branchId);
      if (!basket) {
        basket = {
          branchId: hit.branchId,
          storeName: hit.storeName,
          branchName: hit.branchName,
          distanceKm: hit.distanceKm,
          itemsFound: 0,
          itemsTotal: terms.length,
          total: 0,
        };
        basketByBranch.set(hit.branchId, basket);
      }
      basket.itemsFound += 1;
      basket.total += hit.effectivePrice;
    }
  }

  // Most complete basket first; cheaper wins among equally complete ones.
  const baskets = [...basketByBranch.values()].sort(
    (a, b) => b.itemsFound - a.itemsFound || a.total - b.total,
  );

  // The "mix and match" floor: cheapest option per item, any store.
  const cheapestMixTotal = items.reduce(
    (sum, item) => sum + (item.cheapest?.effectivePrice ?? 0),
    0,
  );

  return { location, radiusKm, items, baskets, cheapestMixTotal };
}
