export const dynamic = "force-dynamic";

import { getPosts } from "@/app/lib/postService";
import LikeButton from "@/app/components/LikeButton";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function HomePage() {
  const posts = await getPosts();

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
          <Link href={`/post/${post.id}`}>
            <h2 className="font-semibold text-lg cursor-pointer hover:underline">
              {post.video_title}
            </h2>
          </Link>

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

              <p className="text-xs text-gray-400">
                {new Date(post.created_at).toLocaleString()}
              </p>
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
    </main>
  );
}
