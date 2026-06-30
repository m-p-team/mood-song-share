"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { MOODS, serializeMoods } from "@/app/lib/moods";
import { ArrowLeft, Link2, Music, Search, Globe, Lock } from "lucide-react";

type Visibility = "public" | "private";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "public", label: "全体公開", desc: "誰でも見られる", icon: <Globe size={15} /> },
  { value: "private", label: "自分のみ", desc: "自分だけ見られる", icon: <Lock size={15} /> },
];
import Link from "next/link";
import dynamic from "next/dynamic";

const YouTubeSearchModal = dynamic(
  () => import("@/app/components/YouTubeSearchModal"),
  { ssr: false }
);

export default function PostPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();

  const [title, setTitle] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [saving, setSaving] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const toggleMood = (label: string) => {
    setMoods((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  if (!loading && !user) {
    return (
      <main className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
          <Music size={28} className="text-violet-500" />
        </div>
        <p className="text-slate-600 font-medium">投稿するにはログインが必要です</p>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-full bg-linear-to-r from-violet-600 to-purple-500 text-white text-sm font-medium shadow-sm hover:opacity-90 transition-all"
        >
          ログインする
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || moods.length === 0) return;

    setSaving(true);

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      mood: serializeMoods(moods),
      video_id: videoId,
      video_title: title,
      video_url: videoUrl,
      visibility,
    });

    setSaving(false);

    if (error) {
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
    <main className="max-w-xl mx-auto px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        戻る
      </Link>

      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-violet-600 to-purple-500 px-6 py-5">
          <h1 className="text-xl font-bold text-white">投稿する</h1>
          <p className="text-violet-200 text-sm mt-0.5">今日の1曲をシェアしよう</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">タイトル</label>
            <input
              className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all placeholder-slate-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="今日の1曲"
              required
            />
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              今日の気分
              {moods.length === 0 && <span className="ml-1 text-xs text-rose-400">（必須・複数選択可）</span>}
              {moods.length > 0 && <span className="ml-1 text-xs text-violet-500">{moods.length}個選択中</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(({ label, emoji, color }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleMood(label)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    moods.includes(label)
                      ? `${color} ring-2 ring-offset-1 ring-violet-400 scale-105`
                      : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          {/* YouTube URL + Search */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">YouTube URL</label>
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
              >
                <Search size={13} />
                動画を検索して選ぶ
              </button>
            </div>
            <div className="relative">
              <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full border border-slate-200 pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all placeholder-slate-400"
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
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">公開範囲</label>
            <div className="flex gap-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVisibility(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                    visibility === opt.value
                      ? "border-violet-400 bg-violet-50 text-violet-700 ring-2 ring-violet-300 ring-offset-1"
                      : "border-slate-200 text-slate-500 hover:border-violet-300"
                  }`}
                >
                  <span className={visibility === opt.value ? "text-violet-600" : "text-slate-400"}>
                    {opt.icon}
                  </span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {videoId && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">プレビュー</p>
              <div className="rounded-xl overflow-hidden border border-violet-100">
                <iframe
                  className="w-full"
                  height="220"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <button
            disabled={saving || moods.length === 0}
            type="submit"
            className="w-full py-3 rounded-xl font-medium text-sm text-white bg-linear-to-r from-violet-600 to-purple-500 disabled:opacity-50 hover:opacity-90 transition-all shadow-sm"
          >
            {saving ? "投稿中..." : "投稿する"}
          </button>
        </form>
      </div>

      {showSearch && (
        <YouTubeSearchModal
          onSelect={(video) => {
            setVideoId(video.id);
            setVideoUrl(video.url);
            if (!title) setTitle(video.title);
            setShowSearch(false);
          }}
          onClose={() => setShowSearch(false)}
        />
      )}
    </main>
  );
}
