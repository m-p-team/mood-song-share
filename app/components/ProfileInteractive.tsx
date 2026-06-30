"use client";

import { Music2, Heart } from "lucide-react";

type Props = {
  postCount: number;
  totalLikes: number;
};

export default function ProfileInteractive({ postCount, totalLikes }: Props) {
  return (
    <div className="flex gap-5 mt-4 pt-4 border-t border-violet-50 flex-wrap">
      <div className="flex items-center gap-2 text-slate-600">
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
          <Music2 size={14} className="text-violet-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{postCount}</p>
          <p className="text-xs text-slate-500">投稿</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-slate-600">
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
          <Heart size={14} className="text-rose-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">{totalLikes}</p>
          <p className="text-xs text-slate-500">いいね合計</p>
        </div>
      </div>
    </div>
  );
}
