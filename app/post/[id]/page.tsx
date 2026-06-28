import { getPostById } from "@/app/lib/postService";
import MoodBadge from "@/app/components/MoodBadge";
import ExternalLink from "@/app/components/ExternalLink";
import Player from "@/app/components/Player";
import Thumbnail from "@/app/components/Thumbnail";
import LikeButton from "@/app/components/LikeButton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors"
      >
        <ArrowLeft size={16} />
        戻る
      </Link>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
        {/* Thumbnail */}
        <div className="rounded-none overflow-hidden">
          <Thumbnail videoId={`${post.video_id}`} />
        </div>

        <div className="p-5 space-y-4">
          {/* Title & mood */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-800 leading-snug">
              {post.video_title}
            </h1>
            <MoodBadge mood={post.mood} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <ExternalLink url={post.video_url} />
            <LikeButton postId={post.id} />
          </div>

          <p className="text-xs text-slate-400">
            投稿日: {new Date(post.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
          </p>
        </div>
      </div>

      {/* Player */}
      <Player videoId={`${post.video_id}`} mood={post.mood} />
    </div>
  );
}
