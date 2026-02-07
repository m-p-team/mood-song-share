"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Ellipsis, Trash2, Pencil, Share2 } from "lucide-react";

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
  const ref = useRef<HTMLDivElement>(null);

  // 背景クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "おすすめの投稿",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("URLをコピーしました");
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name !== "AbortError") {
        console.error(err);
      }
    } finally {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)}>
        <Ellipsis size={24} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 w-40
  bg-white rounded-lg
  shadow-[0_8px_24px_rgba(0,0,0,0.08)]
  text-sm z-50 overflow-hidden"
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
      )}
    </div>
  );
}
