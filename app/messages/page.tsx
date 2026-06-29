"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { getConversations } from "@/app/lib/postService";
import { useRouter } from "next/navigation";

type Conversation = {
  otherUser: { id: string; name: string | null; avatar_url: string | null };
  lastMessage: string;
  lastAt: string;
  unread: boolean;
};

export default function MessagesPage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    getConversations(user.id)
      .then(setConvos)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors"
      >
        <ArrowLeft size={16} />
        戻る
      </Link>

      <div className="flex items-center gap-2">
        <MessageSquare size={20} className="text-violet-600" />
        <h1 className="text-xl font-bold text-slate-800">メッセージ</h1>
      </div>

      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-100 rounded w-24" />
                  <div className="h-3 bg-slate-100 rounded w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : convos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center">
              <MessageSquare size={24} className="text-violet-400" />
            </div>
            <p className="text-sm text-slate-500">メッセージはありません</p>
            <p className="text-xs text-slate-400">フォロワーのプロフィールからDMを送れます</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {convos.map((c) => (
              <li key={c.otherUser.id}>
                <Link
                  href={`/messages/${c.otherUser.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-violet-50 transition-colors ${c.unread ? "bg-violet-50/50" : ""}`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                    {c.otherUser.avatar_url ? (
                      <Image
                        src={c.otherUser.avatar_url}
                        alt={c.otherUser.name ?? ""}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-violet-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-violet-600">
                          {(c.otherUser.name ?? "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${c.unread ? "text-violet-700" : "text-slate-800"}`}>
                        {c.otherUser.name ?? "ユーザー"}
                      </p>
                      <span className="text-[11px] text-slate-400 shrink-0">{c.lastAt}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${c.unread ? "text-slate-700 font-medium" : "text-slate-500"}`}>
                      {c.lastMessage}
                    </p>
                  </div>
                  {c.unread && (
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
