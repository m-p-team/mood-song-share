"use client";

import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  postId: string;
};

export default function LikeButton({ postId }: Props) {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [popping, setPopping] = useState(false);

  useEffect(() => {
    const fetchLikeInfo = async () => {
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      setLikeCount(count ?? 0);

      if (!user) return;

      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      setLiked(!!data);
    };

    fetchLikeInfo();
  }, [user, postId]);

  async function handleClick() {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (saving) return;
    setSaving(true);

    if (liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) {
        toast.error("いいねの解除に失敗しました");
      } else {
        setLiked(false);
        setLikeCount((c) => c - 1);
      }
    } else {
      const { error } = await supabase.from("likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      if (error) {
        toast.error("いいねに失敗しました");
      } else {
        setLiked(true);
        setLikeCount((c) => c + 1);
        setPopping(true);
        setTimeout(() => setPopping(false), 400);
      }
    }

    setSaving(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving || loading}
      className="flex items-center gap-1.5 group cursor-pointer disabled:cursor-default"
      aria-label={liked ? "いいね解除" : "いいね"}
    >
      <Heart
        size={22}
        className={`transition-all ${popping ? "like-pop" : ""} ${
          liked
            ? "text-rose-500 fill-rose-500"
            : "text-slate-400 group-hover:text-rose-400"
        }`}
        strokeWidth={liked ? 0 : 1.8}
      />
      <span
        className={`text-sm font-medium tabular-nums transition-colors ${
          liked ? "text-rose-500" : "text-slate-400 group-hover:text-rose-400"
        }`}
      >
        {likeCount}
      </span>
    </button>
  );
}
