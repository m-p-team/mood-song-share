"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { getFollowers, getFollowing } from "@/app/lib/postService";

type UserSummary = { id: string; name: string | null; avatar_url: string | null };
type Mode = "followers" | "following";

type Props = {
  userId: string;
  initialMode: Mode;
  followerCount: number;
  followingCount: number;
  onClose: () => void;
};

export default function FollowListModal({ userId, initialMode, followerCount, followingCount, onClose }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [fetchedMode, setFetchedMode] = useState<Mode | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const loading = fetchedMode !== mode;
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
    let cancelled = false;
    const fn = mode === "followers" ? getFollowers : getFollowing;
    fn(userId).then((data) => {
      if (!cancelled) {
        setUsers(data as UserSummary[]);
        setFetchedMode(modeRef.current);
      }
    });
    return () => { cancelled = true; };
  }, [mode, userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center border-b border-slate-100">
          <button
            onClick={() => setMode("followers")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === "followers" ? "text-violet-600 border-b-2 border-violet-600" : "text-slate-500"
            }`}
          >
            フォロワー {followerCount}
          </button>
          <button
            onClick={() => setMode("following")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === "following" ? "text-violet-600 border-b-2 border-violet-600" : "text-slate-500"
            }`}
          >
            フォロー中 {followingCount}
          </button>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                  <div className="h-4 bg-slate-100 rounded w-32" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">
              {mode === "followers" ? "フォロワーはいません" : "フォロー中のユーザーはいません"}
            </p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {users.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/profile/${u.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-violet-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                      {u.avatar_url ? (
                        <Image
                          src={u.avatar_url}
                          alt={u.name ?? ""}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-violet-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-violet-600">
                            {(u.name ?? "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-800">{u.name ?? "ユーザー"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
