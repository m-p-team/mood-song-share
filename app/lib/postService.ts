import { supabase } from "@/app/lib/supabaseClient";

function formatJst(dateStr: string) {
  return new Date(dateStr).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
    created_at_jst: formatJst(post.created_at),
  }));
}

export async function getPopularPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*, likes(count)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("人気投稿の取得に失敗しました");
  }

  return data
    .map((post) => ({
      ...post,
      like_count: (post.likes as { count: number }[])?.[0]?.count ?? 0,
      created_at_jst: formatJst(post.created_at),
    }))
    .sort((a, b) => b.like_count - a.like_count);
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

export async function getUserPosts(userId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, likes(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("ユーザー投稿の取得に失敗しました");
  }

  return data.map((post) => ({
    ...post,
    like_count: (post.likes as { count: number }[])?.[0]?.count ?? 0,
    created_at_jst: formatJst(post.created_at),
  }));
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
