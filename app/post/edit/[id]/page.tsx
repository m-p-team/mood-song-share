"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { MOODS, parseMoods, serializeMoods } from "@/app/lib/moods";
import toast from "react-hot-toast";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const { user, loading } = useSupabaseUser();

  const [title, setTitle] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [videoId, setVideoId] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const toggleMood = (label: string) => {
    setMoods((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  useEffect(() => {
    if (!user) return;

    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("user_id, video_title, mood, video_id")
        .eq("id", postId)
        .single();

      if (error || !data) {
        toast.error("投稿が見つかりません");
        router.replace("/");
        return;
      }

      if (data.user_id !== user.id) {
        router.replace("/?toast=forbidden");
        return;
      }

      setTitle(data.video_title);
      setMoods(parseMoods(data.mood));
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
        mood: serializeMoods(moods),
      })
      .eq("id", postId);

    setSaving(false);

    if (error) {
      toast.error("更新に失敗しました");
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
          <label className="block text-sm mb-1">
            今日の気分
            {moods.length > 0 && <span className="ml-1 text-xs text-violet-500">{moods.length}個選択中</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(({ label, emoji, color }) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleMood(label)}
                className={`px-3 py-1.5 rounded-full border text-sm transition ${
                  moods.includes(label)
                    ? `${color} ring-2 ring-offset-1 ring-violet-400`
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
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
