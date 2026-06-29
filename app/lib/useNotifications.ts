"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  getNotifications,
  markAllNotificationsRead,
  type NotificationRecord,
  type NotificationSettings,
} from "./postService";

const SETTINGS_KEY = "v_tuune_notif_settings";

function loadCachedSettings(): NotificationSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as NotificationSettings) : null;
  } catch {
    return null;
  }
}

function showDesktopNotif(notif: NotificationRecord, settings: NotificationSettings | null) {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (!settings?.desktop_enabled) return;

  const { type, actor } = notif;
  if (type === "like" && !settings.likes_enabled) return;
  if (type === "comment" && !settings.comments_enabled) return;
  if (type === "dm" && !settings.dms_enabled) return;
  if (type === "follow" && !settings.follows_enabled) return;

  const name = actor?.name ?? "ユーザー";
  const body: Record<string, string> = {
    like: `${name} があなたの投稿にいいねしました`,
    comment: `${name} があなたの投稿にコメントしました`,
    dm: `${name} からDMが届きました`,
    follow: `${name} があなたをフォローしました`,
  };

  try {
    new Notification("V-Tuune", { body: body[type] ?? "新しい通知", icon: "/logo.png" });
  } catch {}
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef<NotificationSettings | null>(loadCachedSettings());

  const refresh = useCallback(async () => {
    if (!userId) return;
    const data = await getNotifications(userId);
    setNotifications(data);
    setUnreadCount(data.filter((n) => !n.read_at).length);
    setLoading(false);
  }, [userId]);

  const markRead = useCallback(async () => {
    if (!userId) return;
    await markAllNotificationsRead(userId);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, [userId]);

  const updateSettingsCache = useCallback((s: NotificationSettings) => {
    settingsRef.current = s;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      // Async to avoid synchronous setState in effect body
      Promise.resolve().then(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    // Fetch notifications
    getNotifications(userId).then((data) => {
      if (cancelled) return;
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read_at).length);
      setLoading(false);
    });

    const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";
    const channel = supabase
      .channel(`notifs-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema,
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          supabase
            .from("notifications")
            .select("*, actor:users!actor_id(id, name, avatar_url), posts!post_id(id, video_title)")
            .eq("id", (payload.new as { id: string }).id)
            .single()
            .then(({ data }) => {
              if (!data || cancelled) return;
              const notif = {
                ...data,
                created_at_jst: new Date(data.created_at).toLocaleString("ja-JP", {
                  timeZone: "Asia/Tokyo",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              } as NotificationRecord;
              setNotifications((prev) => [notif, ...prev]);
              setUnreadCount((c) => c + 1);
              showDesktopNotif(notif, settingsRef.current);
            });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { notifications, unreadCount, loading, markRead, refresh, updateSettingsCache };
}
