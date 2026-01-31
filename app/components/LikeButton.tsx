"use client";

import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

type Props = {
  postId: string;
};

export default function LikeButton({ postId }: Props) {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLikeInfo = async () => {
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      setLikeCount(count ?? 0);

      // 自分がいいね済みか
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

      if (!error) {
        setLiked(false);
        setLikeCount((c) => c - 1);
      }
    } else {
      const { error } = await supabase.from("likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      if (!error) {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    }

    setSaving(false);
  }

  return (
    <button onClick={handleClick} disabled={saving} className="cursor-pointer">
      <span>
        {liked ? (
          <Heart
            size={30}
            color="red"
            fill="red"
            strokeWidth={2}
            className="inline-block"
          />
        ) : (
          <Heart size={30} strokeWidth={2} className="inline-block" />
        )}
      </span>
      <span className="text-sm"> {likeCount}</span>
    </button>
  );
}
