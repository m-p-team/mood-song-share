"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Search, X, Loader2 } from "lucide-react";

type YouTubeVideo = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium: { url: string } };
  };
};

type Props = {
  onSelect: (video: { id: string; title: string; url: string }) => void;
  onClose: () => void;
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export default function YouTubeSearchModal({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "検索に失敗しました");
        setResults([]);
        return;
      }

      setResults(data.items ?? []);
      setHasSearched(true);
    } catch {
      setError("検索に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  // タイピング中にデバウンスで自動検索（400ms）
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Escキーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    search(query);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800">YouTube動画を検索</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search input */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 flex gap-2 shrink-0"
        >
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="曲名やアーティスト名で検索..."
              className="w-full border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all placeholder-slate-400"
              autoFocus
            />
            {loading && (
              <Loader2
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500 animate-spin"
              />
            )}
          </div>
        </form>

        {/* Results / Suggestions */}
        <div className="overflow-y-auto flex-1">
          {error && (
            <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-600 leading-relaxed">{error}</p>
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && !error && (
            <p className="text-center text-sm text-slate-500 py-10">
              見つかりませんでした
            </p>
          )}

          {!hasSearched && !loading && !error && (
            <p className="text-center text-sm text-slate-400 py-10">
              検索ワードを入力すると候補が表示されます
            </p>
          )}

          {results.map((video) => (
            <button
              key={video.id.videoId}
              onClick={() =>
                onSelect({
                  id: video.id.videoId,
                  title: decodeHtmlEntities(video.snippet.title),
                  url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                })
              }
              className="w-full flex gap-3 px-4 py-3 hover:bg-violet-50 active:bg-violet-100 transition-colors text-left border-b border-slate-50 last:border-0"
            >
              {/* Thumbnail */}
              <div className="relative w-24 h-[54px] shrink-0 rounded-lg overflow-hidden bg-slate-100">
                <Image
                  src={video.snippet.thumbnails.medium.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">
                  {decodeHtmlEntities(video.snippet.title)}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {video.snippet.channelTitle}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* YouTube attribution (required by YouTube ToS) */}
        <div className="px-4 py-2 border-t border-slate-100 shrink-0">
          <p className="text-[11px] text-slate-400 text-center">
            Powered by YouTube
          </p>
        </div>
      </div>
    </div>
  );
}
