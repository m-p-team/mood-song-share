import { supabase } from "@/app/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export async function syncUserToPublicTable(user: User) {
  // ignoreDuplicates: true で既存ユーザーの name 等カスタム値を上書きしない
  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      name: user.user_metadata.full_name ?? "No Name",
      email: user.email,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (error) {
    console.error("Failed to sync user:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
}
