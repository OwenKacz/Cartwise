/**
 * Geocoding: turn the user's location text (a postal code) into lat/lng
 * coordinates we can measure distances from.
 *
 * PLUGGABLE BY DESIGN (same philosophy as the data-source adapters):
 *   - `geocode()` is the only function the rest of the app calls.
 *   - Which provider actually runs is decided by the GEOCODER_PROVIDER env var
 *     (see `getGeocoderProvider()` in env.ts). Default is the free built-in
 *     mock, so the app runs with zero paid API keys.
 *   - To add Google/Mapbox later: write a function with the same signature and
 *     add a case to the switch in `geocode()`. Nothing else changes.
 */
import { getGeocoderProvider } from "@/lib/env";

/** What every geocoder provider returns. */
export interface GeocodeResult {
  lat: number;
  lng: number;
  /** Human-readable description of what we matched (shown to the user). */
  label: string;
  /** True when the match is a rough guess (e.g. unknown postal code). */
  approximate: boolean;
}

/**
 * The mock provider's lookup table: Canadian "FSA" prefixes (the first 3
 * characters of a postal code, e.g. the "M5T" in "M5T 1T3") mapped to a
 * representative coordinate for that area.
 *
 * This is intentionally tiny — just enough Ontario coverage to demo the app.
 * Real coverage comes from enabling a real provider, not from growing this list.
 */
const MOCK_FSA_TABLE: Record<string, { lat: number; lng: number; label: string }> = {
  // Toronto (downtown / west end — near the two seed store branches)
  M5T: { lat: 43.6536, lng: -79.4004, label: "Toronto — Kensington/College" },
  M6J: { lat: 43.6469, lng: -79.4197, label: "Toronto — Trinity-Bellwoods" },
  M5V: { lat: 43.6443, lng: -79.3953, label: "Toronto — Entertainment District" },
  M5A: { lat: 43.6555, lng: -79.3626, label: "Toronto — Corktown" },
  M4Y: { lat: 43.6657, lng: -79.3834, label: "Toronto — Church-Wellesley" },
  M6G: { lat: 43.6683, lng: -79.4205, label: "Toronto — Christie Pits" },
  // A few other Ontario cities (so non-Toronto codes at least resolve)
  K1A: { lat: 45.4215, lng: -75.6972, label: "Ottawa" },
  L8S: { lat: 43.2609, lng: -79.9192, label: "Hamilton" },
  N2L: { lat: 43.4723, lng: -80.5449, label: "Waterloo" },
  L5B: { lat: 43.589, lng: -79.6441, label: "Mississauga" },
};

/** Used when we can't make sense of the input at all. */
const MOCK_FALLBACK: GeocodeResult = {
  lat: 43.6534,
  lng: -79.3841,
  label: "Toronto (default — postal code not recognized by the mock geocoder)",
  approximate: true,
};

/**
 * The free built-in provider. Understands:
 *   1. "lat,lng" pairs typed directly (handy for testing), e.g. "43.65,-79.40"
 *   2. Canadian postal codes — matched by their first 3 characters (FSA)
 *   3. Anything else → downtown Toronto, flagged as approximate
 */
function mockGeocode(locationText: string): GeocodeResult {
  const text = locationText.trim();

  // Case 1: a raw "lat,lng" pair.
  const coordMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    return {
      lat: Number(coordMatch[1]),
      lng: Number(coordMatch[2]),
      label: "exact coordinates",
      approximate: false,
    };
  }

  // Case 2: postal code → look up its FSA (first 3 chars, no spaces).
  const fsa = text.replace(/\s+/g, "").slice(0, 3).toUpperCase();
  const hit = MOCK_FSA_TABLE[fsa];
  if (hit) {
    return { lat: hit.lat, lng: hit.lng, label: hit.label, approximate: true };
  }

  // Case 3: no idea — use the fallback so the app still works.
  return MOCK_FALLBACK;
}

/**
 * The one entry point the app uses. Async because real providers (Google,
 * Mapbox) are HTTP calls — the mock just resolves immediately.
 */
export async function geocode(locationText: string): Promise<GeocodeResult> {
  switch (getGeocoderProvider()) {
    // Real providers get added here later (Phase 8 / when keys exist):
    // case "google": return googleGeocode(locationText);
    // case "mapbox": return mapboxGeocode(locationText);
    case "mock":
    default:
      return mockGeocode(locationText);
  }
}
