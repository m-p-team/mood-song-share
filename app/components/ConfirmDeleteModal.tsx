"use client";

import { useEffect } from "react";
import { Trash2, X } from "lucide-react";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDeleteModal({ onConfirm, onCancel }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
            <Trash2 size={22} className="text-rose-600" />
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="font-bold text-lg text-slate-800">投稿を削除しますか？</h2>
          <p className="text-sm text-slate-500">この操作は取り消せません。</p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
