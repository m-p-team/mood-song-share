"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Ellipsis, Trash2, Pencil, Share2 } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  postId: string;
  isOwner: boolean;
  shareUrl: string;
  onDelete: () => void;
};

export default function PostMenu({
  postId,
  isOwner,
  shareUrl,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
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

  const menu = open ? (
    <div
      ref={menuRef}
      style={{ top: menuPos.top, right: menuPos.right }}
      className="fixed w-40 bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.12)] text-sm z-50 overflow-hidden"
    >
      <button
        onClick={handleShare}
        className="w-full px-3 py-2 flex justify-between items-center hover:bg-gray-50 text-black cursor-pointer"
      >
        <span>シェア</span>
        <Share2 size={16} />
      </button>

      {isOwner && (
        <>
          <div className="border-t border-gray-100" />
          <Link
            href={`/post/edit/${postId}`}
            className="px-3 py-2 flex justify-between items-center hover:bg-gray-50 text-black"
            onClick={() => setOpen(false)}
          >
            <span>編集</span>
            <Pencil size={16} />
          </Link>

          <div className="border-t border-gray-100" />

          <button
            onClick={onDelete}
            className="w-full px-3 py-2 flex justify-between items-center text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <span>削除</span>
            <Trash2 size={16} />
          </button>
        </>
      )}
    </div>
  ) : null;

  return (
    <div>
      <button ref={buttonRef} onClick={handleOpen}>
        <Ellipsis size={24} />
      </button>
      {typeof document !== "undefined" && createPortal(menu, document.body)}
    </div>
  );
}
