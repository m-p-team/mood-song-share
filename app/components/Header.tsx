"use client";

import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";

export default function Header() {
  const { user, loading } = useSupabaseUser();

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
            <span className="text-sm text-gray-500">未ログイン</span>
          )}
        </>
      )}
    </header>
  );
}
