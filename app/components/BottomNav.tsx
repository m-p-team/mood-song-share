"use client";

import Link from "next/link";
import { Home, Search, PlusCircle, User, MessageSquare, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { useNotifications } from "@/app/lib/useNotifications";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useSupabaseUser();
  const { unreadCount } = useNotifications(user?.id ?? null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const items = [
    { href: "/", icon: Home, label: "ホーム", badge: 0 },
    { href: "/search", icon: Search, label: "検索", badge: 0 },
    { href: "/post", icon: PlusCircle, label: "投稿", badge: 0 },
    { href: "/notifications", icon: Bell, label: "通知", badge: unreadCount },
    { href: "/messages", icon: MessageSquare, label: "トーク", badge: 0 },
    { href: user ? `/profile/${user.id}` : "/login", icon: User, label: "プロフィール", badge: 0 },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-violet-100 shadow-[0_-4px_16px_rgba(124,58,237,0.08)]">
      <div className="flex items-center justify-around h-16 px-1">
        {items.map(({ href, icon: Icon, label, badge }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all ${
                active ? "text-violet-600" : "text-slate-400 hover:text-violet-500"
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={active ? "drop-shadow-sm" : ""}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-medium ${active ? "text-violet-600" : ""}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
