"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, LogOut, User } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, loading } = useSupabaseUser();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-violet-100 shadow-sm">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl overflow-hidden">
            <Image src="/logo.png" alt="V-Tuune" width={32} height={32} className="object-cover" />
          </div>
          <span className="font-bold text-lg bg-linear-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
            V-Tuune
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/search"
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-all"
          >
            <Search size={19} />
          </Link>

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-1">
                  <Link
                    href={`/profile/${user.id}`}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-all"
                  >
                    <User size={19} />
                  </Link>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                    title="ログアウト"
                  >
                    <LogOut size={17} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="ml-1 px-4 py-1.5 text-sm font-medium rounded-full bg-linear-to-r from-violet-600 to-purple-500 text-white hover:opacity-90 transition-all shadow-sm"
                >
                  ログイン
                </button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
