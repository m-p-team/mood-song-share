import { supabase } from "@/app/lib/supabaseClient";

export async function getPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("投稿一覧の取得に失敗しました");
  }

  return data;
}

export async function getPostById(id: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    throw new Error("投稿の取得に失敗しました");
  }

  return data;
}
