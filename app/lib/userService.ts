import { supabase } from "@/app/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export async function syncUserToPublicTable(user: User) {
  // INSERT only — never update. This prevents OAuth metadata from
  // overwriting a custom display name the user has set.
  const { error } = await supabase.from("users").insert({
    id: user.id,
    name: user.user_metadata.full_name ?? "No Name",
    email: user.email,
  });

  // 23505 = unique_violation (user already exists) — expected, ignore it
  if (error && error.code !== "23505") {
    console.error("Failed to sync user:", error.message);
  }
}
