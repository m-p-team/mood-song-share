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

export async function getFollowingPosts(userId: string) {
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (!follows || follows.length === 0) return [];

  const followingIds = follows.map((f) => f.following_id);

  const { data, error } = await supabase
    .from("posts")
    .select("*, likes(count), users!user_id(name, avatar_url)")
    .in("user_id", followingIds)
    .in("visibility", ["public", "followers_only"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("フォロー中投稿の取得に失敗しました");
  }

  return data.map((post) => ({
    ...post,
    like_count: (post.likes as { count: number }[])?.[0]?.count ?? 0,
    created_at_jst: formatJst(post.created_at),
  }));
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

export async function getOwnPostsClient(userId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, users!user_id(name, avatar_url)")
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

export async function getFollowers(userId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, users!follower_id(id, name, avatar_url)")
    .eq("following_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((row) => row.users as unknown as { id: string; name: string | null; avatar_url: string | null });
}

export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id, users!following_id(id, name, avatar_url)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((row) => row.users as unknown as { id: string; name: string | null; avatar_url: string | null });
}

// ---------- Likers ----------

export async function getLikers(postId: string) {
  const { data, error } = await supabase
    .from("likes")
    .select("user_id, users!user_id(id, name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((row) => row.users as unknown as { id: string; name: string | null; avatar_url: string | null });
}

// ---------- Comments ----------

export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, users!user_id(id, name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((c) => ({
    ...c,
    created_at_jst: formatJst(c.created_at),
  }));
}

export async function addComment(postId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: userId, content })
    .select("*, users!user_id(id, name, avatar_url)")
    .single();

  if (error) throw error;

  return { ...data, created_at_jst: formatJst(data.created_at) };
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

// ---------- Messages ----------

export async function getConversations(userId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:users!sender_id(id, name, avatar_url), receiver:users!receiver_id(id, name, avatar_url)")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  const seenUsers = new Set<string>();
  const convos: {
    otherUser: { id: string; name: string | null; avatar_url: string | null };
    lastMessage: string;
    lastAt: string;
    unread: boolean;
  }[] = [];

  for (const msg of data) {
    const isSender = msg.sender_id === userId;
    const other = (isSender ? msg.receiver : msg.sender) as { id: string; name: string | null; avatar_url: string | null };
    if (!other || seenUsers.has(other.id)) continue;
    seenUsers.add(other.id);
    convos.push({
      otherUser: other,
      lastMessage: msg.content,
      lastAt: formatJst(msg.created_at),
      unread: !isSender && !msg.read_at,
    });
  }

  return convos;
}

export async function getMessages(userId: string, otherId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:users!sender_id(id, name, avatar_url)")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((m) => ({
    ...m,
    created_at_jst: formatJst(m.created_at),
  }));
}

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select("*, sender:users!sender_id(id, name, avatar_url)")
    .single();

  if (error) throw error;

  return { ...data, created_at_jst: formatJst(data.created_at) };
}

export async function markMessagesRead(senderId: string, receiverId: string) {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", senderId)
    .eq("receiver_id", receiverId)
    .is("read_at", null);
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
    .select("*, posts!post_id(id, video_id, video_title, mood, user_id, users!user_id(name, avatar_url))")
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
