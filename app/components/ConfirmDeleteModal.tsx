"use client";

import { useEffect } from "react";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDeleteModal({ onConfirm, onCancel }: Props) {
  // ESCキーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 text-black"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl p-6 w-80 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg">投稿を削除しますか？</h2>

        <p className="text-sm text-gray-600">この操作は取り消せません。</p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-100"
          >
            キャンセル
          </button>

          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded text-sm bg-red-600 text-white hover:bg-red-700"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
