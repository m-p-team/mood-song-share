"use client";

import Link from "next/link";
import { Home, Search, PlusCircle, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useSupabaseUser();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const items = [
    { href: "/", icon: Home, label: "ホーム" },
    { href: "/search", icon: Search, label: "検索" },
    { href: "/post", icon: PlusCircle, label: "投稿" },
    { href: user ? `/profile/${user.id}` : "/login", icon: User, label: "プロフィール" },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-violet-100 shadow-[0_-4px_16px_rgba(124,58,237,0.08)]">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all ${
                active ? "text-violet-600" : "text-slate-400 hover:text-violet-500"
              }`}
            >
              <Icon
                size={22}
                className={active ? "drop-shadow-sm" : ""}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-medium ${active ? "text-violet-600" : ""}`}>
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
