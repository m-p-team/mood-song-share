import { supabase } from "@/app/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

// Ensures the authenticated user has a row in the app's users table.
// Only stores the user's auth ID — no name or email (privacy).
export async function syncUserToAppTable(user: User) {
  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("[syncUserToAppTable] select error:", selectError.message, selectError.code);
    return;
  }

  if (existing) return;

  const { error: insertError } = await supabase.from("users").insert({
    id: user.id,
  });

  // 23505 = race condition (another tab inserted first) — safe to ignore
  if (insertError && insertError.code !== "23505") {
    console.error("[syncUserToAppTable] insert error:", insertError.message, insertError.code);
  }
}

export { syncUserToAppTable as syncUserToPublicTable };
