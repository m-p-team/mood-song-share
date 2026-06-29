"use client";

import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import {
  getMessages,
  sendMessage,
  markMessagesRead,
  getUserProfile,
} from "@/app/lib/postService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Msg = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at_jst: string;
  sender: { id: string; name: string | null; avatar_url: string | null } | null;
};

type UserProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

type Props = { params: Promise<{ userId: string }> };

export default function ConversationPage({ params }: Props) {
  const { userId: otherId } = use(params);
  const { user, loading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    Promise.all([
      getMessages(user.id, otherId),
      getUserProfile(otherId),
      markMessagesRead(otherId, user.id),
    ]).then(([msgs, profile]) => {
      setMessages(msgs as Msg[]);
      setOtherUser(profile as UserProfile);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    });
  }, [user, authLoading, otherId, router]);

  const handleSend = async () => {
    if (!user || !text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(user.id, otherId, text.trim());
      setMessages((prev) => [...prev, msg as Msg]);
      setText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      toast.error("送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const displayName = otherUser?.name ?? "ユーザー";

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: "calc(100dvh - 80px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Link href="/messages" className="text-slate-500 hover:text-violet-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <Link href={`/profile/${otherId}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
            {otherUser?.avatar_url ? (
              <Image
                src={otherUser.avatar_url}
                alt={displayName}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-violet-100 flex items-center justify-center">
                <span className="text-sm font-bold text-violet-600">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <span className="font-semibold text-slate-800">{displayName}</span>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <p className="text-sm text-slate-400">まだメッセージがありません</p>
            <p className="text-xs text-slate-300">最初のメッセージを送りましょう</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? "bg-linear-to-br from-violet-600 to-purple-500 text-white rounded-br-sm"
                        : "bg-white border border-violet-100 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400 px-1">{msg.created_at_jst}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-slate-100 shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="メッセージを入力..."
          maxLength={1000}
          className="flex-1 text-sm border border-slate-200 rounded-2xl px-4 py-2.5 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-violet-700 transition-colors shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </main>
  );
}
