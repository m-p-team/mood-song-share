"use client";

import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <main className="p-10 flex flex-col items-center gap-4">
      <h1 className="text-xl font-bold">ログイン</h1>

      <button
        onClick={handleLogin}
        className="px-4 py-2 rounded bg-black text-white"
      >
        Googleでログイン
      </button>
    </main>
  );
}
