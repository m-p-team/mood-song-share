"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Send } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { MOODS, getMoodStyle } from "@/app/lib/moods";

type Post = {
  id: string;
  mood: string;
  video_id: string;
  video_title: string;
  created_at: string;
};

type AiRecommendation = {
  id: string;
  reason: string;
  post: {
    id: string;
    mood: string;
    video_id: string;
    video_title: string;
  };
};

type AiResult = {
  message: string;
  recommendations: AiRecommendation[];
  error?: string;
};

export default function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMood = searchParams.get("mood") ?? null;

  const [selectedMood, setSelectedMood] = useState<string | null>(initialMood);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      let query = supabase
        .from("posts")
        .select("id, mood, video_id, video_title, created_at")
        .order("created_at", { ascending: false });

      if (selectedMood) {
        query = query.eq("mood", selectedMood);
      }

      const { data } = await query;
      setPosts(data ?? []);
      setLoading(false);
    };

    fetchPosts();
  }, [selectedMood]);

  const handleMoodSelect = (mood: string | null) => {
    setSelectedMood(mood);
    if (mood) {
      router.replace(`/search?mood=${encodeURIComponent(mood)}`);
    } else {
      router.replace("/search");
    }
  };

  const handleAiSearch = async () => {
    const q = aiQuery.trim();
    if (!q || aiLoading) return;

    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data: AiResult = await res.json();
      if (!res.ok) {
        setAiResult({ message: "", recommendations: [], error: data.error ?? "エラーが発生しました。" });
      } else {
        setAiResult(data);
      }
    } catch {
      setAiResult({ message: "", recommendations: [], error: "通信エラーが発生しました。" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAiSearch();
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* AI Search */}
      <section className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-violet-600 to-purple-500 px-5 py-4 flex items-center gap-2">
          <Sparkles size={18} className="text-white" />
          <h2 className="font-semibold text-white">AIに相談する</h2>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`今の気分や状況を教えてください…\n例：「勉強に集中したい」「落ち込んでいる気分を上げたい」`}
              rows={2}
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent placeholder-slate-400 transition-all"
            />
            <button
              onClick={handleAiSearch}
              disabled={!aiQuery.trim() || aiLoading}
              className="self-end px-4 py-3 rounded-xl bg-linear-to-br from-violet-600 to-purple-500 text-white disabled:opacity-40 hover:opacity-90 transition-all shadow-sm"
            >
              {aiLoading ? (
                <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>

          {aiLoading && (
            <p className="text-sm text-violet-500 animate-pulse">AIが考えています...</p>
          )}

          {aiResult && (
            <div className="space-y-3">
              {aiResult.error ? (
                <p className="text-sm text-rose-500 bg-rose-50 rounded-xl px-4 py-3">{aiResult.error}</p>
              ) : (
                <>
                  <p className="text-sm text-slate-700 bg-violet-50 rounded-xl px-4 py-3 border border-violet-100">
                    {aiResult.message}
                  </p>
                  {aiResult.recommendations.length > 0 && (
                    <div className="space-y-2">
                      {aiResult.recommendations.map((rec) => (
                        <Link
                          key={rec.id}
                          href={`/post/${rec.id}`}
                          className="flex gap-3 bg-white rounded-xl border border-violet-100 p-3 hover:shadow-md hover:border-violet-200 transition-all"
                        >
                          <div className="relative w-24 h-16 shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={`https://img.youtube.com/vi/${rec.post.video_id}/mqdefault.jpg`}
                              alt={rec.post.video_title}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          </div>
                          <div className="flex flex-col justify-between py-0.5 min-w-0">
                            <p className="font-medium text-sm text-slate-800 line-clamp-1">
                              {rec.post.video_title}
                            </p>
                            <p className="text-xs text-violet-600">{rec.reason}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Mood filter */}
      <section className="space-y-4">
        <h1 className="text-xl font-bold text-slate-800">気分で探す</h1>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleMoodSelect(null)}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
              !selectedMood
                ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
            }`}
          >
            すべて
          </button>
          {MOODS.map(({ emoji, label, color }) => (
            <button
              key={label}
              onClick={() =>
                handleMoodSelect(selectedMood === label ? null : label)
              }
              className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                selectedMood === label
                  ? `${color} ring-2 ring-offset-1 ring-violet-400`
                  : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 bg-white rounded-xl border border-violet-100 p-3 animate-pulse">
                <div className="w-32 h-20 bg-slate-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-2xl">
              🎵
            </div>
            <p className="text-slate-500 text-sm">投稿がありません</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {posts.map((post) => {
            const moodStyle = getMoodStyle(post.mood);
            return (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="flex gap-3 bg-white border border-violet-100 rounded-2xl p-3 hover:shadow-md hover:border-violet-200 transition-all"
              >
                <div className="relative w-32 h-20 shrink-0 rounded-xl overflow-hidden">
                  <Image
                    src={`https://img.youtube.com/vi/${post.video_id}/mqdefault.jpg`}
                    alt={post.video_title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <div className="flex flex-col justify-between py-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 line-clamp-2 leading-snug">
                    {post.video_title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${moodStyle}`}>
                      {post.mood}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(post.created_at).toLocaleDateString("ja-JP", {
                        timeZone: "Asia/Tokyo",
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
