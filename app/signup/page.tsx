"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { Music2, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("パスワードは6文字以上にしてください");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("パスワードが一致しません");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("このメールアドレスはすでに登録されています");
      } else {
        toast.error("登録に失敗しました: " + error.message);
      }
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-xl">
            <Music2 size={36} className="text-white" />
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-violet-100 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center text-2xl">
              ✉️
            </div>
            <h2 className="font-bold text-xl text-slate-800">確認メールを送信しました</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              <strong>{email}</strong> に確認メールを送りました。
              メール内のリンクをクリックして登録を完了してください。
            </p>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl bg-linear-to-r from-violet-600 to-purple-500 text-white font-medium text-sm hover:opacity-90 transition-all shadow-sm text-center"
            >
              ログインページへ
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
            <p className="text-slate-500 text-sm">新規アカウント登録</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 space-y-5 shadow-sm border border-violet-100">
          <div className="space-y-1 text-center">
            <h2 className="font-bold text-xl text-slate-800">アカウント作成</h2>
          </div>

          <form onSubmit={handleSignup} className="space-y-3">
            {/* Name */}
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="表示名"
                maxLength={50}
                required
                className="w-full border border-slate-200 pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all placeholder-slate-400"
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード（6文字以上）"
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

            {/* Password confirm */}
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="パスワード（確認）"
                required
                className="w-full border border-slate-200 pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition-all placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-linear-to-r from-violet-600 to-purple-500 text-white font-medium text-sm hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? "登録中..." : "アカウントを作成"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-violet-600 font-medium hover:underline">
              ログイン
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400">
            登録することで利用規約に同意したことになります
          </p>
        </div>
      </div>
    </main>
  );
}
