"use client";

import { useState } from "react";
import Link from "next/link";
import { Music2, Heart, Users, MessageSquare } from "lucide-react";
import FollowButton from "@/app/components/FollowButton";
import FollowListModal from "@/app/components/FollowListModal";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";

type Mode = "followers" | "following";

type Props = {
  targetUserId: string;
  postCount: number;
  totalLikes: number;
  followerCount: number;
  followingCount: number;
};

export default function ProfileInteractive({
  targetUserId,
  postCount,
  totalLikes,
  followerCount,
  followingCount,
}: Props) {
  const { user } = useSupabaseUser();
  const [modal, setModal] = useState<Mode | null>(null);
  const [followerCountLocal, setFollowerCountLocal] = useState(followerCount);
  const isOwnProfile = user?.id === targetUserId;

  return (
    <>
      {/* Follow + DM row */}
      {!isOwnProfile && (
        <div className="flex items-center gap-2 mb-3">
          <FollowButton
            targetUserId={targetUserId}
            onFollowChange={(following) =>
              setFollowerCountLocal((c) => c + (following ? 1 : -1))
            }
          />
          {user && (
            <Link
              href={`/messages/${targetUserId}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600 border border-slate-200 transition-all"
            >
              <MessageSquare size={14} />
              DM
            </Link>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-5 mt-4 pt-4 border-t border-violet-50 flex-wrap">
        <div className="flex items-center gap-2 text-slate-600">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
            <Music2 size={14} className="text-violet-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{postCount}</p>
            <p className="text-xs text-slate-500">投稿</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
            <Heart size={14} className="text-rose-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{totalLikes}</p>
            <p className="text-xs text-slate-500">いいね合計</p>
          </div>
        </div>
        <button
          onClick={() => setModal("followers")}
          className="flex items-center gap-2 text-slate-600 hover:text-violet-600 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Users size={14} className="text-blue-500" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-slate-800">{followerCountLocal}</p>
            <p className="text-xs text-slate-500">フォロワー</p>
          </div>
        </button>
        <button
          onClick={() => setModal("following")}
          className="flex items-center gap-2 text-slate-600 hover:text-violet-600 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <Users size={14} className="text-indigo-500" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-slate-800">{followingCount}</p>
            <p className="text-xs text-slate-500">フォロー中</p>
          </div>
        </button>
      </div>

      {modal && (
        <FollowListModal
          userId={targetUserId}
          initialMode={modal}
          followerCount={followerCountLocal}
          followingCount={followingCount}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
