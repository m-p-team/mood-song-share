"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

async function fetchUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export function useUnreadMessages(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;
    fetchUnreadCount(userId).then((c) => { if (!cancelled) setUnreadCount(c); });

    const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";
    const channel = supabase
      .channel(`msgs-unread-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema, table: "messages", filter: `receiver_id=eq.${userId}` },
        () => { setUnreadCount((c) => c + 1); }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema, table: "messages", filter: `receiver_id=eq.${userId}` },
        () => { fetchUnreadCount(userId).then((c) => { if (!cancelled) setUnreadCount(c); }); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unreadCount;
}
