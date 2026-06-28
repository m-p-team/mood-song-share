import { Suspense } from "react";
import SearchContent from "./SearchContent";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-6 text-slate-400 text-sm">読み込み中...</div>}>
      <SearchContent />
    </Suspense>
  );
}
