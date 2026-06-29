"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Heart, Globe, Users, Lock } from "lucide-react";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import MoodBadge from "@/app/components/MoodBadge";
import PostMenu from "@/app/components/PostMenu";
import ConfirmDeleteModal from "@/app/components/ConfirmDeleteModal";
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Visibility = "public" | "followers_only" | "private";

type Post = {
  id: string;
  user_id: string;
  video_id: string;
  video_title: string;
  mood: string;
  visibility?: string;
  like_count?: number;
};

type Props = {
  posts: Post[];
  profileUserId: string;
};

const VISIBILITY_ICON: Record<string, React.ReactNode> = {
  public: <Globe size={11} className="text-slate-400" />,
  followers_only: <Users size={11} className="text-violet-400" />,
  private: <Lock size={11} className="text-slate-500" />,
};

const VISIBILITY_LABEL: Record<string, string> = {
  followers_only: "フォロワーのみ",
  private: "自分のみ",
};

export default function ProfilePostsClient({ posts: initialPosts, profileUserId }: Props) {
  const { user, loading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const isOwnProfile = !authLoading && user?.id === profileUserId;
  const [postVisibilities, setPostVisibilities] = useState<Record<string, Visibility>>({});
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  // Reset local state when initial posts change (e.g. router.refresh)
  useEffect(() => {
    setPostVisibilities({});
    setRemovedIds(new Set());
  }, [initialPosts]);

  const displayPosts = initialPosts.filter((p) => {
    if (removedIds.has(p.id)) return false;
    // Own profile: show all posts
    if (isOwnProfile) return true;
    // While auth is loading, show only public (safe default)
    const vis = postVisibilities[p.id] ?? p.visibility ?? "public";
    return vis === "public";
  });

  const handleDelete = async () => {
    if (!deletePostId) return;
    const { error } = await supabase.from("posts").delete().eq("id", deletePostId);
    if (error) {
      toast.error("削除に失敗しました");
      return;
    }
    setRemovedIds((prev) => new Set([...prev, deletePostId]));
    setDeletePostId(null);
    router.refresh();
  };

  if (displayPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-2xl">🎵</div>
        <p className="text-slate-500 text-sm">まだ投稿がありません</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {displayPosts.map((post) => {
          const vis = (postVisibilities[post.id] ?? post.visibility ?? "public") as Visibility;
          const isOwner = user?.id === post.user_id;
          const isHidden = vis !== "public";

          return (
            <div
              key={post.id}
              className={`flex gap-3 bg-white border rounded-2xl p-3 hover:shadow-md transition-all group ${
                isOwner && isHidden ? "border-amber-200" : "border-violet-100 hover:border-violet-200"
              }`}
            >
              <Link
                href={`/post/${post.id}`}
                className="relative w-28 shrink-0 rounded-xl overflow-hidden"
                style={{ height: "72px" }}
              >
                <Image
                  src={`https://img.youtube.com/vi/${post.video_id}/mqdefault.jpg`}
                  alt={post.video_title}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/20">
                  <Play size={18} className="text-white" fill="white" />
                </div>
              </Link>

              <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1">
                  <Link href={`/post/${post.id}`} className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 line-clamp-2 leading-snug hover:text-violet-600 transition-colors">
                      {post.video_title}
                    </p>
                  </Link>
                  {isOwner && (
                    <PostMenu
                      postId={post.id}
                      isOwner={true}
                      shareUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/post/${post.id}`}
                      visibility={vis}
                      onDelete={() => setDeletePostId(post.id)}
                      onVisibilityChange={(v) =>
                        setPostVisibilities((prev) => ({ ...prev, [post.id]: v }))
                      }
                    />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <MoodBadge mood={post.mood} clickable={false} />
                  <div className="flex items-center gap-2">
                    {isOwner && isHidden && (
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                        {VISIBILITY_ICON[vis]}
                        {VISIBILITY_LABEL[vis]}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Heart size={11} className="text-rose-400" fill="currentColor" />
                      <span>{post.like_count ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {deletePostId && (
        <ConfirmDeleteModal
          onConfirm={handleDelete}
          onCancel={() => setDeletePostId(null)}
        />
      )}
    </>
  );
}
