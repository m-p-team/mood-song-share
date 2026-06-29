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
    .select("*, users!user_id(name, avatar_url)")
    .eq("visibility", "public")
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
    .select("*, likes(count), users!user_id(name, avatar_url)")
    .eq("visibility", "public")
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
    .select("*, users!user_id(name, avatar_url)")
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
    .select("id, name, email, avatar_url, banner_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export async function getFollowCounts(userId: string) {
  const [followersRes, followingRes] = await Promise.all([
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);

  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}

export async function checkIsFollowing(followerId: string, followingId: string) {
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  return !!data;
}

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) throw error;
}
