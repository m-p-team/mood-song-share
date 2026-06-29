"use client";

import { useState } from "react";
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
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(false);

    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "検索に失敗しました");
        return;
      }

      setResults(data.items ?? []);
      setSearched(true);
    } catch {
      setError("検索に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
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
        <form onSubmit={handleSearch} className="px-4 py-3 flex gap-2 shrink-0 border-b border-slate-50">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="曲名やアーティスト名で検索..."
            className="flex-1 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all placeholder-slate-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-purple-500 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-all hover:opacity-90"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </button>
        </form>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {error && (
            <p className="text-center text-sm text-red-500 py-6 px-4">{error}</p>
          )}
          {!loading && searched && results.length === 0 && !error && (
            <p className="text-center text-sm text-slate-500 py-10">
              見つかりませんでした
            </p>
          )}
          {!searched && !loading && !error && (
            <p className="text-center text-sm text-slate-400 py-10">
              検索ワードを入力してください
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
              className="w-full flex gap-3 px-4 py-3 hover:bg-violet-50 transition-colors text-left border-b border-slate-50 last:border-0"
            >
              <div className="relative w-28 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                <Image
                  src={video.snippet.thumbnails.medium.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">
                  {decodeHtmlEntities(video.snippet.title)}
                </p>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {video.snippet.channelTitle}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* YouTube attribution (required by YouTube ToS) */}
        <div className="px-4 py-2.5 border-t border-slate-100 shrink-0">
          <p className="text-xs text-slate-400 text-center">Powered by YouTube</p>
        </div>
      </div>
    </div>
  );
}
