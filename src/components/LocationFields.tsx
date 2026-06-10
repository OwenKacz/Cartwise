/**
 * The "where are you?" inputs shared by both search pages: postal code +
 * search radius. Plain HTML inputs inside the parent page's GET <form> —
 * no client-side JavaScript needed.
 */
export function LocationFields({
  defaultLocation,
  defaultRadius,
}: {
  defaultLocation: string;
  defaultRadius: number;
}) {
  return (
    <div className="flex gap-3">
      <label className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Postal code
        </span>
        <input
          type="text"
          name="loc"
          defaultValue={defaultLocation}
          placeholder="e.g. M5T 1T3"
          autoComplete="postal-code"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

      <label className="flex w-28 shrink-0 flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Radius
        </span>
        <select
          name="radius"
          defaultValue={String(defaultRadius)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="2">2 km</option>
          <option value="5">5 km</option>
          <option value="10">10 km</option>
          <option value="25">25 km</option>
          <option value="50">50 km</option>
        </select>
      </label>
    </div>
  );
}
