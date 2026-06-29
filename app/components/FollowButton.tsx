"use client";

import { useEffect, useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { checkIsFollowing, followUser, unfollowUser } from "@/app/lib/postService";
import toast from "react-hot-toast";

type Props = {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
};

export default function FollowButton({ targetUserId, onFollowChange }: Props) {
  const { user } = useSupabaseUser();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetUserId) {
      setLoading(false);
      return;
    }

    checkIsFollowing(user.id, targetUserId)
      .then(setIsFollowing)
      .finally(() => setLoading(false));
  }, [user, targetUserId]);

  if (!user || user.id === targetUserId) return null;

  const handleToggle = async () => {
    if (pending || !user) return;
    setPending(true);

    try {
      if (isFollowing) {
        await unfollowUser(user.id, targetUserId);
        setIsFollowing(false);
        onFollowChange?.(false);
        toast.success("フォローを解除しました");
      } else {
        await followUser(user.id, targetUserId);
        setIsFollowing(true);
        onFollowChange?.(true);
        toast.success("フォローしました");
      }
    } catch {
      toast.error("操作に失敗しました");
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-9 w-28 rounded-full bg-slate-100 animate-pulse" />
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      type="button"
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-60 ${
        isFollowing
          ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 border border-slate-200"
          : "bg-linear-to-r from-violet-600 to-purple-500 text-white shadow-sm hover:opacity-90"
      }`}
    >
      {isFollowing ? (
        <>
          <UserCheck size={15} />
          フォロー中
        </>
      ) : (
        <>
          <UserPlus size={15} />
          フォロー
        </>
      )}
    </button>
  );
}
