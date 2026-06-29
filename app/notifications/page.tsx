"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Settings, Heart, MessageCircle, MessageSquare, UserPlus, ArrowLeft } from "lucide-react";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { useNotifications } from "@/app/lib/useNotifications";
import { useRouter } from "next/navigation";
import type { NotificationRecord, NotificationType } from "@/app/lib/postService";

function notifHref(n: NotificationRecord): string {
  if (n.type === "like" || n.type === "comment") return n.post_id ? `/post/${n.post_id}` : "/";
  if (n.type === "dm") return `/messages/${n.actor_id}`;
  return `/profile/${n.actor_id}`;
}

function notifMessage(n: NotificationRecord): string {
  const name = n.actor?.name ?? "ユーザー";
  const title = n.posts?.video_title ? `「${n.posts.video_title}」` : "投稿";
  const map: Record<NotificationType, string> = {
    like: `${name} が${title}にいいねしました`,
    comment: `${name} が${title}にコメントしました`,
    dm: `${name} からDMが届きました`,
    follow: `${name} があなたをフォローしました`,
  };
  return map[n.type];
}

function NotifIcon({ type }: { type: NotificationType }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0";
  if (type === "like") return <div className={`${base} bg-rose-100`}><Heart size={14} className="text-rose-500" /></div>;
  if (type === "comment") return <div className={`${base} bg-violet-100`}><MessageCircle size={14} className="text-violet-500" /></div>;
  if (type === "dm") return <div className={`${base} bg-blue-100`}><MessageSquare size={14} className="text-blue-500" /></div>;
  return <div className={`${base} bg-emerald-100`}><UserPlus size={14} className="text-emerald-500" /></div>;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const { notifications, unreadCount, loading, markRead } = useNotifications(user?.id ?? null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Mark all as read when page is viewed
  useEffect(() => {
    if (user && unreadCount > 0) {
      markRead();
    }
  }, [user, unreadCount, markRead]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors"
      >
        <ArrowLeft size={16} />
        戻る
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-violet-600" />
          <h1 className="text-xl font-bold text-slate-800">通知</h1>
        </div>
        <Link
          href="/notifications/settings"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors"
        >
          <Settings size={15} />
          設定
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-50">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded w-40" />
                  <div className="h-3 bg-slate-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center">
              <Bell size={24} className="text-violet-400" />
            </div>
            <p className="text-sm text-slate-500">通知はありません</p>
            <p className="text-xs text-slate-400">いいね・コメント・DM・フォローで通知が届きます</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={notifHref(n)}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-violet-50 transition-colors ${
                    !n.read_at ? "bg-violet-50/40" : ""
                  }`}
                >
                  {/* Actor avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {n.actor?.avatar_url ? (
                        <Image
                          src={n.actor.avatar_url}
                          alt={n.actor.name ?? ""}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-violet-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-violet-600">
                            {(n.actor?.name ?? "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <NotifIcon type={n.type} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read_at ? "font-semibold text-slate-800" : "text-slate-700"}`}>
                      {notifMessage(n)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.created_at_jst}</p>
                  </div>

                  {!n.read_at && (
                    <div className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
