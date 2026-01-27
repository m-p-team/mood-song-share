import { supabase } from "@/app/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export async function syncUserToPublicTable(user: User) {
  const { error, data } = await supabase.from("users").upsert({
    id: user.id,
    name: user.user_metadata.full_name ?? "No Name",
    email: user.email,
  });

  if (error) {
    console.error("Failed to sync user:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  } else {
    console.log("User synced:", data);
  }
}
