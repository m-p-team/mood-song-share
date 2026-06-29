"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ListMusic, Plus, Trash2, X, Check } from "lucide-react";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import {
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  getPlaylistItems,
  removeFromPlaylist,
} from "@/app/lib/postService";
import toast from "react-hot-toast";
import { addToPlaylist } from "@/app/lib/postService";

type Playlist = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  item_count: number;
};

type PlaylistItem = {
  id: string;
  post_id: string;
  posts: {
    id: string;
    video_id: string;
    video_title: string;
    mood: string;
    user_id: string;
  } | null;
};

export default function PlaylistSection({ profileUserId }: { profileUserId: string }) {
  const { user } = useSupabaseUser();
  const isOwner = user?.id === profileUserId;

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    getPlaylists(profileUserId)
      .then((data) => setPlaylists(data as Playlist[]))
      .finally(() => setLoading(false));
  }, [profileUserId]);

  const handleCreate = async () => {
    if (!user || !newName.trim() || creating) return;
    setCreating(true);
    try {
      const pl = await createPlaylist(user.id, newName.trim());
      setPlaylists((prev) => [{ ...pl, item_count: 0 }, ...prev]);
      setNewName("");
    } catch {
      toast.error("プレイリストの作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlaylist(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      if (openId === id) setOpenId(null);
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  const handleOpen = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    setItemsLoading(true);
    try {
      const data = await getPlaylistItems(id);
      setItems(data as PlaylistItem[]);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleRemoveItem = async (playlistId: string, postId: string) => {
    try {
      await removeFromPlaylist(playlistId, postId);
      setItems((prev) => prev.filter((i) => i.post_id !== postId));
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, item_count: Math.max(0, p.item_count - 1) } : p))
      );
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-700">
          <ListMusic size={16} className="text-violet-500" />
          プレイリスト
        </h2>
        {isOwner && (
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="新しいプレイリスト名"
              maxLength={100}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-violet-400 w-40 transition-all"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-violet-700 transition-colors shrink-0"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">
          {isOwner ? "プレイリストを作成しましょう" : "プレイリストはありません"}
        </p>
      ) : (
        <div className="space-y-2">
          {playlists.map((pl) => (
            <div key={pl.id} className="bg-white border border-violet-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => handleOpen(pl.id)}
                  className="flex-1 flex items-center gap-2 text-left hover:text-violet-600 transition-colors"
                >
                  <ListMusic size={15} className="text-violet-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 truncate">{pl.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{pl.item_count}曲</span>
                  <span className="text-xs text-slate-300 shrink-0">{openId === pl.id ? "▲" : "▼"}</span>
                </button>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(pl.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {openId === pl.id && (
                <div className="border-t border-violet-50">
                  {itemsLoading ? (
                    <div className="p-3 space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex gap-2 animate-pulse">
                          <div className="w-12 h-8 rounded bg-slate-100 shrink-0" />
                          <div className="h-4 bg-slate-100 rounded flex-1" />
                        </div>
                      ))}
                    </div>
                  ) : items.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">まだ曲がありません</p>
                  ) : (
                    <ul className="divide-y divide-violet-50">
                      {items.map((item) => {
                        const post = item.posts;
                        if (!post) return null;
                        return (
                          <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                            <Link href={`/post/${post.id}`} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-70 transition-opacity">
                              <div className="relative w-12 h-8 rounded overflow-hidden shrink-0">
                                <Image
                                  src={`https://img.youtube.com/vi/${post.video_id}/mqdefault.jpg`}
                                  alt={post.video_title}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                              <span className="text-xs text-slate-700 line-clamp-1 flex-1">{post.video_title}</span>
                            </Link>
                            {isOwner && (
                              <button
                                onClick={() => handleRemoveItem(pl.id, post.id)}
                                className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Small button used on post detail page to add to a playlist
export function AddToPlaylistButton({ postId }: { postId: string }) {
  const { user } = useSupabaseUser();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !open) return;
    getPlaylists(user.id).then((data) => setPlaylists(data as Playlist[]));
  }, [user, open]);

  if (!user) return null;

  const handleAdd = async (playlistId: string) => {
    if (done.includes(playlistId)) return;
    try {
      await addToPlaylist(playlistId, postId, 0);
      setDone((prev) => [...prev, playlistId]);
      toast.success("プレイリストに追加しました");
    } catch {
      toast.error("すでに追加されているか、エラーが発生しました");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
      >
        <ListMusic size={13} />
        プレイリストに追加
      </button>
      {open && (
        <div className="absolute bottom-7 left-0 bg-white rounded-xl shadow-lg border border-violet-100 w-52 z-20 overflow-hidden">
          {playlists.length === 0 ? (
            <p className="text-xs text-slate-400 p-3 text-center">プレイリストがありません</p>
          ) : (
            <ul className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
              {playlists.map((pl) => (
                <li key={pl.id}>
                  <button
                    onClick={() => handleAdd(pl.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                      done.includes(pl.id)
                        ? "text-violet-600 bg-violet-50"
                        : "text-slate-700 hover:bg-violet-50"
                    }`}
                  >
                    <span className="truncate">{pl.name}</span>
                    {done.includes(pl.id) && <Check size={13} className="text-violet-500 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

