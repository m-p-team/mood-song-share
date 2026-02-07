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

  return data.map((post) => ({
    ...post,
    created_at_jst: new Date(post.created_at).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));
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
