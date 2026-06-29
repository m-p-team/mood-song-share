"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Send, Trash2, MessageCircle } from "lucide-react";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { getComments, addComment, deleteComment } from "@/app/lib/postService";
import toast from "react-hot-toast";

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at_jst: string;
  users: { id: string; name: string | null; avatar_url: string | null } | null;
};

export default function CommentSection({ postId }: { postId: string }) {
  const { user } = useSupabaseUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getComments(postId)
      .then((data) => setComments(data as Comment[]))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSend = async () => {
    if (!user || !text.trim() || sending) return;
    setSending(true);
    try {
      const comment = await addComment(postId, user.id, text.trim());
      setComments((prev) => [...prev, comment as Comment]);
      setText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      toast.error("コメントの送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error("コメントの削除に失敗しました");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-700">
        <MessageCircle size={16} className="text-violet-500" />
        コメント
        <span className="text-sm font-normal text-slate-400">({comments.length})</span>
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-slate-100 rounded w-24" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">まだコメントはありません</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Link href={`/profile/${c.user_id}`} className="shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  {c.users?.avatar_url ? (
                    <Image
                      src={c.users.avatar_url}
                      alt={c.users.name ?? ""}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-violet-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-violet-600">
                        {(c.users?.name ?? "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <Link
                    href={`/profile/${c.user_id}`}
                    className="text-xs font-semibold text-slate-700 hover:text-violet-600 transition-colors"
                  >
                    {c.users?.name ?? "ユーザー"}
                  </Link>
                  <span className="text-[10px] text-slate-400">{c.created_at_jst}</span>
                </div>
                <p className="text-sm text-slate-700 mt-0.5 break-words">{c.content}</p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="shrink-0 p-1 text-slate-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {user ? (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            maxLength={500}
            placeholder="コメントを入力..."
            className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-violet-700 transition-colors shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
          <Link href="/login" className="text-violet-600 hover:underline">ログイン</Link>するとコメントできます
        </p>
      )}
    </div>
  );
}
