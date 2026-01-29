"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";

export default function PostPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();

  const [mood, setMood] = useState("");
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
      video_title: "仮タイトル",
      video_url: `https://www.youtube.com/watch?v=${videoId}`,
    });

    setSaving(false);

    if (error) {
      alert("保存に失敗しました");
      console.error(error);
      return;
    }

    router.push("/");
  }

  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">投稿する</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm mb-1">YouTube Video ID（仮）</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="dQw4w9WgXcQ"
            required
          />
        </div>

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
