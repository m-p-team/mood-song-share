"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Ellipsis, Trash2, Pencil, Share2, Globe, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/app/lib/supabaseClient";

type Visibility = "public" | "followers_only" | "private";

type Props = {
  postId: string;
  isOwner: boolean;
  shareUrl: string;
  visibility?: Visibility;
  onDelete: () => void;
  onVisibilityChange?: (v: Visibility) => void;
};

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: React.ReactNode }[] = [
  { value: "public", label: "全体公開", icon: <Globe size={14} /> },
  { value: "private", label: "自分のみ", icon: <Lock size={14} /> },
];

export default function PostMenu({
  postId,
  isOwner,
  shareUrl,
  visibility,
  onDelete,
  onVisibilityChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showVisibility, setShowVisibility] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
    setShowVisibility(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setShowVisibility(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "おすすめの投稿", url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("URLをコピーしました");
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name !== "AbortError") {
        console.error(err);
      }
    } finally {
      setOpen(false);
    }
  };

  const handleVisibilityChange = async (v: Visibility) => {
    const { error } = await supabase
      .from("posts")
      .update({ visibility: v })
      .eq("id", postId);

    if (error) {
      toast.error("公開範囲の変更に失敗しました");
      console.error(error);
    } else {
      toast.success("公開範囲を変更しました");
      onVisibilityChange?.(v);
    }
    setOpen(false);
    setShowVisibility(false);
  };

  const menu = open ? (
    <div
      ref={menuRef}
      style={{ top: menuPos.top, right: menuPos.right }}
      className="fixed w-44 bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.12)] text-sm z-[100] overflow-hidden"
    >
      <button
        onClick={handleShare}
        className="w-full px-3 py-2.5 flex justify-between items-center hover:bg-gray-50 text-black cursor-pointer"
      >
        <span>シェア</span>
        <Share2 size={15} />
      </button>

      {isOwner && (
        <>
          <div className="border-t border-gray-100" />
          <button
            onClick={() => setShowVisibility((v) => !v)}
            className="w-full px-3 py-2.5 flex justify-between items-center hover:bg-gray-50 text-black cursor-pointer"
          >
            <span>公開範囲</span>
            <Globe size={15} className="text-slate-400" />
          </button>

          {showVisibility && (
            <div className="border-t border-gray-100 bg-gray-50">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleVisibilityChange(opt.value)}
                  className={`w-full px-4 py-2 flex items-center gap-2 hover:bg-violet-50 cursor-pointer text-left ${
                    visibility === opt.value ? "text-violet-600 font-medium" : "text-slate-600"
                  }`}
                >
                  <span className={visibility === opt.value ? "text-violet-600" : "text-slate-400"}>
                    {opt.icon}
                  </span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100" />
          <Link
            href={`/post/edit/${postId}`}
            className="px-3 py-2.5 flex justify-between items-center hover:bg-gray-50 text-black"
            onClick={() => setOpen(false)}
          >
            <span>編集</span>
            <Pencil size={15} />
          </Link>

          <div className="border-t border-gray-100" />
          <button
            onClick={onDelete}
            className="w-full px-3 py-2.5 flex justify-between items-center text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <span>削除</span>
            <Trash2 size={15} />
          </button>
        </>
      )}
    </div>
  ) : null;

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        type="button"
        className="p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
        aria-label="メニューを開く"
      >
        <Ellipsis size={20} />
      </button>
      {typeof document !== "undefined" && createPortal(menu, document.body)}
    </div>
  );
}
