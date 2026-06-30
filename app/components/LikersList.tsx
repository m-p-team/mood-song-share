"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, User } from "lucide-react";
import { getLikers } from "@/app/lib/postService";

type UserSummary = { id: string; avatar_url: string | null };

export default function LikersList({ postId }: { postId: string }) {
  const [likers, setLikers] = useState<UserSummary[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getLikers(postId).then((data) => setLikers(data as UserSummary[]));
  }, [postId]);

  if (likers.length === 0) return null;

  const shown = expanded ? likers : likers.slice(0, 5);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 transition-colors"
      >
        <Heart size={12} className="text-rose-400" fill="currentColor" />
        <span className="font-medium">{likers.length}人がいいね</span>
        <span className="text-slate-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="flex flex-wrap gap-2">
          {shown.map((u) => (
            <Link
              key={u.id}
              href={`/profile/${u.id}`}
              className="flex items-center gap-1.5 bg-rose-50 rounded-full px-2 py-1 hover:bg-rose-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                {u.avatar_url ? (
                  <Image
                    src={u.avatar_url}
                    alt="ユーザー"
                    width={20}
                    height={20}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-rose-200 flex items-center justify-center">
                    <User size={10} className="text-rose-500" />
                  </div>
                )}
              </div>
            </Link>
          ))}
          {!expanded && likers.length > 5 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-violet-600 hover:underline"
            >
              他{likers.length - 5}人
            </button>
          )}
        </div>
      )}
    </div>
  );
}
