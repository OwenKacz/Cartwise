"use server";

/**
 * Server actions for saved grocery lists.
 *
 * A saved list = one `grocery_lists` row (the name) + one `grocery_list_items`
 * row per line of the list (the raw text the user typed). RLS makes both
 * tables private to their owner, so these queries can only ever touch the
 * logged-in user's own rows.
 */
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Save the list currently shown on /list
// ---------------------------------------------------------------------------
export async function saveList(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=Log in to save lists.");

  const name = String(formData.get("name") ?? "").trim() || "My grocery list";
  const rawItems = String(formData.get("items") ?? "");

  // Same splitting rules as the search itself (newlines or commas).
  const terms = [
    ...new Set(
      rawItems
        .split(/[\n,]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    ),
  ].slice(0, 30);

  if (terms.length === 0) {
    redirect("/list?error=Nothing to save — the list is empty.");
  }

  // 1. Create the list…
  const { data: list, error: listError } = await supabase
    .from("grocery_lists")
    .insert({ user_id: user!.id, name })
    .select("id")
    .single();
  if (listError || !list) {
    redirect(`/list?error=${encodeURIComponent(listError?.message ?? "Could not save.")}`);
  }

  // 2. …then its items.
  const { error: itemsError } = await supabase
    .from("grocery_list_items")
    .insert(terms.map((raw_text) => ({ list_id: list!.id, raw_text })));
  if (itemsError) {
    redirect(`/list?error=${encodeURIComponent(itemsError.message)}`);
  }

  redirect("/lists?message=List saved.");
}

// ---------------------------------------------------------------------------
// Delete a saved list (items cascade-delete with it)
// ---------------------------------------------------------------------------
export async function deleteList(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const listId = String(formData.get("list_id") ?? "");
  if (listId) {
    // RLS scopes the delete to the owner; .eq is just belt-and-braces.
    await supabase.from("grocery_lists").delete().eq("id", listId);
  }
  redirect("/lists?message=List deleted.");
}
