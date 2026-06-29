"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Play, TrendingUp, Clock } from "lucide-react";
import LikeButton from "@/app/components/LikeButton";
import PostMenu from "@/app/components/PostMenu";
import MoodBadge from "@/app/components/MoodBadge";
import ConfirmDeleteModal from "@/app/components/ConfirmDeleteModal";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { supabase } from "@/app/lib/supabaseClient";
import { getPopularPosts } from "@/app/lib/postService";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type Post = {
  id: string;
  user_id: string;
  mood: string;
  video_id: string;
  video_title: string;
  video_url: string;
  created_at_jst: string;
  like_count?: number;
  users?: { name: string | null; avatar_url: string | null } | null;
};

type Props = {
  posts: Post[];
};

type Tab = "new" | "popular";

export default function HomePageClient({ posts: initialPosts }: Props) {
  const { user } = useSupabaseUser();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);

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

  useEffect(() => {
    if (activeTab === "popular" && popularPosts.length === 0) {
      setPopularLoading(true);
      getPopularPosts()
        .then(setPopularPosts)
        .catch(() => toast.error("人気投稿の取得に失敗しました"))
        .finally(() => setPopularLoading(false));
    }
  }, [activeTab]);

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

  const displayPosts = activeTab === "new" ? initialPosts : popularPosts;

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
      </div>

      {/* Loading */}
      {activeTab === "popular" && popularLoading && (
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
      {!popularLoading && displayPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-3xl">
            🎵
          </div>
          <p className="text-slate-500 text-sm">まだ投稿がありません</p>
          <Link
            href="/post"
            className="text-sm font-medium text-violet-600 hover:underline"
          >
            最初の投稿をしてみよう
          </Link>
        </div>
      )}

      {/* Post cards */}
      {!(activeTab === "popular" && popularLoading) && displayPosts.map((post, i) => (
        <div
          key={post.id}
          className="bg-white rounded-2xl overflow-hidden border border-violet-100 shadow-sm hover:shadow-md transition-all animate-fade-in-up"
          style={{ animationDelay: `${i * 50}ms` }}
        >
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
                isOwner={post.user_id === user?.id}
                shareUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/post/${post.id}`}
                onDelete={() => setDeletePostId(post.id)}
              />
            </div>

            <MoodBadge mood={post.mood} />

            {/* User info */}
            <Link
              href={`/profile/${post.user_id}`}
              className="flex items-center gap-2 w-fit hover:opacity-80 transition-opacity"
            >
              {post.users?.avatar_url ? (
                <Image
                  src={post.users.avatar_url}
                  alt={post.users.name ?? ""}
                  width={22}
                  height={22}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-[22px] h-[22px] rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-violet-600">
                    {(post.users?.name ?? "?").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs text-slate-500 font-medium">{post.users?.name ?? "ユーザー"}</span>
            </Link>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <a
                  href={post.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1 transition-colors"
                >
                  YouTubeで見る →
                </a>
                <span className="text-xs text-slate-400">{post.created_at_jst}</span>
              </div>
              <LikeButton postId={post.id} />
            </div>
          </div>
        </div>
      ))}

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
