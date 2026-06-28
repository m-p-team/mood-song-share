"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { ArrowLeft, User, Save } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();

  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) {
          setName(data.name);
          setOriginalName(data.name);
        }
        setFetching(false);
      });
  }, [user]);

  if (!loading && !user) {
    router.replace("/login");
    return null;
  }

  const isDirty = name.trim() !== originalName;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setSaving(true);

    const { error } = await supabase
      .from("users")
      .update({ name: name.trim() })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error("保存に失敗しました");
      console.error(error);
      return;
    }

    toast.success("プロフィールを更新しました");
    router.push(`/profile/${user.id}`);
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <main className="max-w-md mx-auto px-4 py-6">
      <Link
        href={user ? `/profile/${user.id}` : "/"}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        戻る
      </Link>

      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-violet-600 to-purple-500 px-6 py-5">
          <h1 className="text-xl font-bold text-white">プロフィール編集</h1>
          <p className="text-violet-200 text-sm mt-0.5">表示名を変更できます</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar preview */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-violet-100 to-purple-100 border-4 border-white shadow-md flex items-center justify-center">
              {fetching ? (
                <User size={28} className="text-violet-300 animate-pulse" />
              ) : (
                <span className="text-3xl font-bold text-violet-600">{initial}</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                表示名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="名前を入力..."
                maxLength={50}
                required
                disabled={fetching}
                className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className="text-xs text-slate-400 text-right">{name.length} / 50</p>
            </div>

            {user?.email && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-500">
                  メールアドレス <span className="text-xs text-slate-400">（変更不可）</span>
                </label>
                <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-500">
                  {user.email}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || fetching || !isDirty || !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-white bg-linear-to-r from-violet-600 to-purple-500 disabled:opacity-50 hover:opacity-90 transition-all shadow-sm"
            >
              <Save size={16} />
              {saving ? "保存中..." : "保存する"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
