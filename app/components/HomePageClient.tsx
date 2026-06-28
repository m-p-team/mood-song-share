"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import LikeButton from "@/app/components/LikeButton";
import PostMenu from "@/app/components/PostMenu";
import ConfirmDeleteModal from "@/app/components/ConfirmDeleteModal";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { supabase } from "@/app/lib/supabaseClient";
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
};

type Props = {
  posts: Post[];
};

export default function HomePageClient({ posts }: Props) {
  const { user } = useSupabaseUser();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!deletePostId) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", deletePostId);

    if (error) {
      alert("削除に失敗しました");
      console.error(error);
      return;
    }

    setDeletePostId(null);
    router.refresh();
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">🎵 投稿一覧</h1>

      {posts.length === 0 && (
        <p className="text-gray-500">まだ投稿がありません</p>
      )}

      {posts.map((post) => (
        <div
          key={post.id}
          className="border rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition"
        >
          <div className="flex justify-between">
            <Link href={`/post/${post.id}`}>
              <h2 className="font-semibold text-lg hover:underline">
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

          <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            #{post.mood}
          </span>

          <iframe
            className="w-full rounded"
            height="220"
            src={`https://www.youtube.com/embed/${post.video_id}`}
            allowFullScreen
          />

          <div className="flex justify-between">
            <div>
              <a
                href={post.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline"
              >
                YouTubeで見る →
              </a>
              <p className="text-xs text-gray-400">{post.created_at_jst}</p>
            </div>

            <LikeButton postId={post.id} />
          </div>
        </div>
      ))}

      <Link
        href="/post"
        className="fixed bottom-6 right-6 w-20 h-20 rounded-full bg-white text-3xl flex items-center justify-center shadow-xl hover:scale-105"
      >
        <Plus size={32} color="black" />
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
