"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Settings, Heart, ArrowLeft, User } from "lucide-react";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { useNotifications } from "@/app/lib/useNotifications";
import { useRouter } from "next/navigation";
import type { NotificationRecord } from "@/app/lib/postService";

function notifHref(n: NotificationRecord): string {
  return n.post_id ? `/post/${n.post_id}` : "/";
}

function notifMessage(n: NotificationRecord): string {
  const title = n.posts?.video_title ? `「${n.posts.video_title}」` : "投稿";
  return `${title}にいいねされました`;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const { notifications, unreadCount, loading, markRead } = useNotifications(user?.id ?? null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

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
            <p className="text-xs text-slate-400">投稿にいいねされると通知が届きます</p>
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
                          alt="ユーザー"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-violet-100 flex items-center justify-center">
                          <User size={18} className="text-violet-400" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center ring-2 ring-white">
                        <Heart size={9} className="text-rose-500" />
                      </div>
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
