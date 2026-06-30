import { supabase } from "@/app/lib/supabaseClient";

export function formatJst(dateStr: string) {
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
    .select("*, users!user_id(avatar_url)")
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
    .select("*, likes(count), users!user_id(avatar_url)")
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
    .select("*, users!user_id(avatar_url)")
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

export async function getOwnPostsClient(userId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, users!user_id(avatar_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((post) => ({
    ...post,
    created_at_jst: formatJst(post.created_at),
  }));
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, avatar_url, banner_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

// ---------- Likers ----------

export async function getLikers(postId: string) {
  const { data, error } = await supabase
    .from("likes")
    .select("user_id, users!user_id(id, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((row) => row.users as unknown as { id: string; avatar_url: string | null });
}

// ---------- Playlists ----------

export async function getPlaylists(userId: string) {
  const { data, error } = await supabase
    .from("playlists")
    .select("*, playlist_items(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((pl) => ({
    ...pl,
    item_count: (pl.playlist_items as { count: number }[])?.[0]?.count ?? 0,
  }));
}

export async function getPlaylistItems(playlistId: string) {
  const { data, error } = await supabase
    .from("playlist_items")
    .select("*, posts!post_id(id, video_id, video_title, mood, user_id, users!user_id(avatar_url))")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function createPlaylist(userId: string, name: string) {
  const { data, error } = await supabase
    .from("playlists")
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePlaylist(playlistId: string) {
  const { error } = await supabase.from("playlists").delete().eq("id", playlistId);
  if (error) throw error;
}

export async function addToPlaylist(playlistId: string, postId: string, position: number) {
  const { error } = await supabase
    .from("playlist_items")
    .insert({ playlist_id: playlistId, post_id: postId, position });

  if (error) throw error;
}

export async function removeFromPlaylist(playlistId: string, postId: string) {
  const { error } = await supabase
    .from("playlist_items")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("post_id", postId);

  if (error) throw error;
}

// ---------- Notifications ----------

export type NotificationType = "like";

export type NotificationRecord = {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  read_at: string | null;
  created_at: string;
  created_at_jst: string;
  actor: { id: string; avatar_url: string | null } | null;
  posts: { id: string; video_title: string } | null;
};

export type NotificationSettings = {
  user_id: string;
  likes_enabled: boolean;
  desktop_enabled: boolean;
};

export async function getNotifications(userId: string): Promise<NotificationRecord[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*, actor:users!actor_id(id, avatar_url), posts!post_id(id, video_title)")
    .eq("user_id", userId)
    .eq("type", "like")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []).map((n) => ({
    ...n,
    created_at_jst: formatJst(n.created_at),
  })) as NotificationRecord[];
}

export async function markAllNotificationsRead(userId: string) {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
  const { data } = await supabase
    .from("notification_settings")
    .select("user_id, likes_enabled, desktop_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  return data as NotificationSettings | null;
}

export async function upsertNotificationSettings(
  userId: string,
  settings: Partial<Omit<NotificationSettings, "user_id">>
) {
  const { error } = await supabase
    .from("notification_settings")
    .upsert(
      { user_id: userId, ...settings, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}
