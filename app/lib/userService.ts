import { supabase } from "@/app/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

// Ensures the authenticated user has a row in the app's users table.
// Strategy:
//   1. SELECT to check if the row exists
//   2. If NOT exists → INSERT with auth metadata name (initial setup only)
//   3. If EXISTS → do nothing (name is never overwritten by this function)
//
// Source of truth for name: prod/dev.users.name (set via profile/edit page)
// Never use auth user_metadata as source of truth for name after first creation.
export async function syncUserToAppTable(user: User) {
  // Step 1: check existence
  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("[syncUserToAppTable] select error:", selectError.message, selectError.code);
    return;
  }

  // Step 2: row already exists — do NOT touch name or any other field
  if (existing) return;

  // Step 3: new user — insert initial record
  const initialName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "ユーザー";

  const { error: insertError } = await supabase.from("users").insert({
    id: user.id,
    name: initialName,
    email: user.email,
  });

  // 23505 = race condition (another tab inserted first) — safe to ignore
  if (insertError && insertError.code !== "23505") {
    console.error("[syncUserToAppTable] insert error:", insertError.message, insertError.code);
  }
}

export { syncUserToAppTable as syncUserToPublicTable };
