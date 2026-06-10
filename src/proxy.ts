/**
 * Next.js 16 proxy (the file formerly known as middleware.ts).
 *
 * Its single job here: keep Supabase auth sessions fresh on every request.
 * The actual logic lives in `src/lib/supabase/proxy.ts` (see the comments
 * there for why this is necessary).
 */
import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on every route EXCEPT static files and images — they can't be
  // logged in, so refreshing a session there is wasted work.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
