"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Play, TrendingUp, Clock, Users, ExternalLink, LogIn } from "lucide-react";
import LikeButton from "@/app/components/LikeButton";
import PostMenu from "@/app/components/PostMenu";
import MoodBadge from "@/app/components/MoodBadge";
import ConfirmDeleteModal from "@/app/components/ConfirmDeleteModal";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { supabase } from "@/app/lib/supabaseClient";
import { getPopularPosts, getFollowingPosts, getOwnPostsClient } from "@/app/lib/postService";
import { parseMoods } from "@/app/lib/moods";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type Visibility = "public" | "followers_only" | "private";

type Post = {
  id: string;
  user_id: string;
  mood: string;
  video_id: string;
  video_title: string;
  video_url: string;
  created_at: string;
  created_at_jst: string;
  visibility?: Visibility;
  like_count?: number;
  users?: { name: string | null; avatar_url: string | null } | null;
};

type Props = {
  posts: Post[];
};

type Tab = "new" | "popular" | "following";

export default function HomePageClient({ posts: initialPosts }: Props) {
  const { user } = useSupabaseUser();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [postVisibilities, setPostVisibilities] = useState<Record<string, Visibility>>({});
  const [removedPostIds, setRemovedPostIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [popularFetched, setPopularFetched] = useState(false);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [followingFetched, setFollowingFetched] = useState(false);
  const [ownPosts, setOwnPosts] = useState<Post[]>([]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const toastType = searchParams.get("toast");
    if (toastType === "forbidden" && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.error("この投稿を編集する権限がありません");
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  // Fetch the current user's own posts (including non-public) client-side
  useEffect(() => {
    if (!user) return;
    getOwnPostsClient(user.id).then((data) => setOwnPosts(data as Post[]));
  }, [user]);

  useEffect(() => {
    if (activeTab !== "popular" || popularFetched) return;
    let cancelled = false;
    getPopularPosts()
      .then((data) => { if (!cancelled) setPopularPosts(data); })
      .catch(() => toast.error("人気投稿の取得に失敗しました"))
      .finally(() => { if (!cancelled) setPopularFetched(true); });
    return () => { cancelled = true; };
  }, [activeTab, popularFetched]);

  useEffect(() => {
    if (activeTab !== "following" || !user || followingFetched) return;
    let cancelled = false;
    getFollowingPosts(user.id)
      .then((data) => { if (!cancelled) setFollowingPosts(data); })
      .catch(() => toast.error("フォロー中投稿の取得に失敗しました"))
      .finally(() => { if (!cancelled) setFollowingFetched(true); });
    return () => { cancelled = true; };
  }, [activeTab, user, followingFetched]);

  const handleDelete = async () => {
    if (!deletePostId) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", deletePostId);

    if (error) {
      toast.error("削除に失敗しました");
      console.error(error);
      return;
    }

    setDeletePostId(null);
    router.refresh();
  };

  // Merge own posts into the "new" feed (dedup by id, own posts take precedence for visibility)
  const mergedNewPosts = useMemo(() => {
    if (!user || ownPosts.length === 0) return initialPosts;
    const ownIds = new Set(ownPosts.map((p) => p.id));
    const othersPublic = initialPosts.filter((p) => !ownIds.has(p.id));
    return [...ownPosts, ...othersPublic].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [initialPosts, ownPosts, user]);

  const getDisplayPosts = () => {
    if (activeTab === "popular") return popularPosts;
    if (activeTab === "following") return followingPosts;
    return mergedNewPosts.filter((p) => !removedPostIds.has(p.id));
  };

  const displayPosts = getDisplayPosts();
  const isLoading =
    (activeTab === "popular" && !popularFetched) ||
    (activeTab === "following" && !followingFetched && !!user);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-2xl p-1 shadow-sm border border-violet-100">
        <button
          onClick={() => setActiveTab("new")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "new"
              ? "bg-linear-to-r from-violet-600 to-purple-500 text-white shadow-sm"
              : "text-slate-500 hover:text-violet-600"
          }`}
        >
          <Clock size={15} />
          新着
        </button>
        <button
          onClick={() => setActiveTab("popular")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "popular"
              ? "bg-linear-to-r from-violet-600 to-purple-500 text-white shadow-sm"
              : "text-slate-500 hover:text-violet-600"
          }`}
        >
          <TrendingUp size={15} />
          人気
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === "following"
              ? "bg-linear-to-r from-violet-600 to-purple-500 text-white shadow-sm"
              : "text-slate-500 hover:text-violet-600"
          }`}
        >
          <Users size={15} />
          フォロー中
        </button>
      </div>

      {/* Following tab — not logged in */}
      {activeTab === "following" && !user && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center">
            <LogIn size={24} className="text-violet-400" />
          </div>
          <p className="text-slate-500 text-sm">ログインするとフォロー中の投稿を見られます</p>
          <Link href="/login" className="text-sm font-medium text-violet-600 hover:underline">
            ログインする
          </Link>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-violet-100 animate-pulse">
              <div className="h-48 bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !(activeTab === "following" && !user) && displayPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-3xl">
            🎵
          </div>
          <p className="text-slate-500 text-sm">
            {activeTab === "following" ? "フォロー中のユーザーの投稿がありません" : "まだ投稿がありません"}
          </p>
          {activeTab === "new" && (
            <Link href="/post" className="text-sm font-medium text-violet-600 hover:underline">
              最初の投稿をしてみよう
            </Link>
          )}
        </div>
      )}

      {/* Post cards */}
      {!isLoading && !(activeTab === "following" && !user) && displayPosts.map((post, i) => {
        const currentVisibility = postVisibilities[post.id] ?? (post.visibility as Visibility) ?? "public";
        const isOwner = post.user_id === user?.id;
        const isHidden = currentVisibility !== "public";

        return (
          <div
            key={post.id}
            className={`bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-all animate-fade-in-up ${
              isOwner && isHidden ? "border-amber-200" : "border-violet-100"
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Non-public owner badge */}
            {isOwner && isHidden && (
              <div className="px-4 pt-2.5 pb-0 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                <span>{currentVisibility === "followers_only" ? "👥 フォロワーのみ" : "🔒 自分のみ"}</span>
                <span className="text-amber-400">（公開フィードには非表示）</span>
              </div>
            )}

            {/* Thumbnail */}
            <Link href={`/post/${post.id}`} className="block relative group">
              <div className="relative w-full" style={{ height: "200px" }}>
                <Image
                  src={`https://img.youtube.com/vi/${post.video_id}/hqdefault.jpg`}
                  alt={post.video_title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 720px"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <Play size={22} className="text-violet-600 ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/post/${post.id}`} className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base text-slate-800 hover:text-violet-600 transition-colors line-clamp-2 leading-snug">
                    {post.video_title}
                  </h2>
                </Link>
                <PostMenu
                  postId={post.id}
                  isOwner={isOwner}
                  shareUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/post/${post.id}`}
                  visibility={currentVisibility}
                  onDelete={() => setDeletePostId(post.id)}
                  onVisibilityChange={(v) => {
                    setPostVisibilities((prev) => ({ ...prev, [post.id]: v }));
                    if (v !== "public" && !isOwner) {
                      setRemovedPostIds((prev) => new Set([...prev, post.id]));
                    }
                    // Update ownPosts local state
                    setOwnPosts((prev) =>
                      prev.map((p) => (p.id === post.id ? { ...p, visibility: v } : p))
                    );
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {parseMoods(post.mood).map((m) => (
                    <MoodBadge key={m} mood={m} />
                  ))}
                </div>

                {/* User info */}
                <Link
                  href={`/profile/${post.user_id}`}
                  className="flex items-center gap-1.5 hover:opacity-70 transition-opacity min-w-0"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                    {post.users?.avatar_url ? (
                      <Image
                        src={post.users.avatar_url}
                        alt={post.users.name ?? ""}
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-violet-100 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-violet-600">
                          {(post.users?.name ?? "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 truncate max-w-[80px]">{post.users?.name ?? "ユーザー"}</span>
                </Link>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <a
                    href={post.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1 transition-colors"
                  >
                    YouTubeで見る
                    <ExternalLink size={11} strokeWidth={2} />
                  </a>
                  <span className="text-xs text-slate-400">{post.created_at_jst}</span>
                </div>
                <LikeButton postId={post.id} />
              </div>
            </div>
          </div>
        );
      })}

      {/* FAB */}
      <Link
        href="/post"
        className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 w-14 h-14 rounded-full bg-linear-to-br from-violet-600 to-purple-500 text-white flex items-center justify-center shadow-xl hover:scale-105 hover:shadow-2xl transition-all"
        aria-label="投稿する"
      >
        <Plus size={26} strokeWidth={2.5} />
      </Link>

      {deletePostId && (
        <ConfirmDeleteModal
          onCancel={() => setDeletePostId(null)}
          onConfirm={handleDelete}
        />
      )}
    </main>
  );
}
