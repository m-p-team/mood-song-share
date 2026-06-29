"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { Music2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error("メールアドレスまたはパスワードが正しくありません");
      return;
    }
    router.push("/");
  };

  return (
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-xl">
            <Music2 size={36} className="text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-linear-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
              V-Tuune
            </h1>
            <p className="text-slate-500 text-sm">
              気分に合わせたVTuber音楽をシェアしよう
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 space-y-5 shadow-sm border border-violet-100">
          <div className="space-y-1 text-center">
            <h2 className="font-bold text-xl text-slate-800">ログイン</h2>
            <p className="text-sm text-slate-500">
              投稿・いいねにはログインが必要です
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm text-slate-700 font-medium text-sm"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Googleでログイン
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">または</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                required
                className="w-full border border-slate-200 pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all placeholder-slate-400"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                required
                className="w-full border border-slate-200 pl-9 pr-10 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-linear-to-r from-violet-600 to-purple-500 text-white font-medium text-sm hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? "ログイン中..." : "メールでログイン"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            アカウントをお持ちでない方は{" "}
            <Link href="/signup" className="text-violet-600 font-medium hover:underline">
              新規登録
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400">
            ログインすることで利用規約に同意したことになります
          </p>
        </div>
      </div>
    </main>
  );
}
