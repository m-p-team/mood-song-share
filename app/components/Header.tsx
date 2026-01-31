"use client";

import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, loading } = useSupabaseUser();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <h1 className="font-bold">Mood Song Share</h1>

      {!loading && (
        <>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm">{user.email}</span>

              <button
                onClick={() => supabase.auth.signOut()}
                className="px-3 py-1 text-sm border rounded"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="px-3 py-1 text-sm border rounded"
            >
              ログイン
            </button>
          )}
        </>
      )}
    </header>
  );
}
