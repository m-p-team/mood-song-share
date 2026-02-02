"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";

export default function PostPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();

  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [saving, setSaving] = useState(false);

  // ログインチェック
  if (!loading && !user) {
    return <p className="p-6">ログインしてください。</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      mood,
      video_id: videoId,
      video_title: title,
      video_url: videoUrl,
    });

    setSaving(false);

    if (error) {
      alert("保存に失敗しました");
      console.error(error);
      return;
    }

    router.push("/");
  }

  function extractYouTubeId(url: string) {
    const regex =
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : "";
  }

  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">投稿する</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">タイトル</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="今日の1曲"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">今日の気分</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">YouTube URL</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={videoUrl}
            onChange={(e) => {
              const url = e.target.value;
              setVideoUrl(url);
              setVideoId(extractYouTubeId(url));
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            required
          />
        </div>

        {videoId && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">プレビュー</p>
            <iframe
              className="w-full rounded"
              height="220"
              src={`https://www.youtube.com/embed/${videoId}`}
              allowFullScreen
            />
          </div>
        )}

        <button
          disabled={saving}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
        >
          {saving ? "保存中..." : "投稿する"}
        </button>
      </form>
    </main>
  );
}
