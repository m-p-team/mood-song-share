"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const { user, loading } = useSupabaseUser();

  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("");
  const [videoId, setVideoId] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("user_id, video_title, mood, video_id")
        .eq("id", postId)
        .single();

      if (error || !data) {
        alert("投稿が見つかりません");
        router.replace("/");
        return;
      }

      if (data.user_id !== user.id) {
        router.replace("/?toast=forbidden");
        return;
      }

      setTitle(data.video_title);
      setMood(data.mood);
      setVideoId(data.video_id);
      setInitialLoading(false);
    };

    fetchPost();
  }, [user, postId, router]);

  if (loading || initialLoading) {
    return <p className="p-6">読み込み中...</p>;
  }

  if (!user) {
    return <p className="p-6">ログインしてください。</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("posts")
      .update({
        video_title: title,
        mood,
      })
      .eq("id", postId);

    setSaving(false);

    if (error) {
      alert("更新に失敗しました");
      console.error(error);
      return;
    }

    router.push(`/post/${postId}`);
  }

  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">投稿を編集</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">タイトル</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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

        <div className="my-5">
          <label className="block text-sm mb-1 text-gray-500">プレビュー</label>
          <iframe
            className="w-full rounded opacity-90"
            height="220"
            src={`https://www.youtube.com/embed/${videoId}`}
            allowFullScreen
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50 cursor-pointer"
          >
            {saving ? "保存中..." : "更新する"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded cursor-pointer"
          >
            キャンセル
          </button>
        </div>
      </form>
    </main>
  );
}
