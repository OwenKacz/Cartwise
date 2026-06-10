/**
 * The "Single item / Grocery list" switcher shown on both search pages.
 * Plain links — switching modes is just navigation.
 */
import Link from "next/link";

export function ModeTabs({ active }: { active: "search" | "list" }) {
  const base =
    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors";
  const on = "bg-emerald-600 text-white";
  const off =
    "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700";

  return (
    <nav className="flex gap-2" aria-label="Search mode">
      <Link href="/search" className={`${base} ${active === "search" ? on : off}`}>
        Single item
      </Link>
      <Link href="/list" className={`${base} ${active === "list" ? on : off}`}>
        Grocery list
      </Link>
    </nav>
  );
}
