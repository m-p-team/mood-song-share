import { supabase } from "./supabaseClient";
import type { User } from "@supabase/supabase-js";

export async function syncUserToPublicTable(user: User) {
  const { error } = await supabase.from("users").upsert({
    id: user.id,
    name: user.user_metadata.full_name ?? "No Name",
    email: user.email,
  });

  if (error) {
    console.error("Failed to sync user:", error);
  }
}
