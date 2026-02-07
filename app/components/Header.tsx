"use client";

import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/app/lib/supabaseClient";
import { useSupabaseUser } from "@/app/lib/useSupabaseUser";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, loading } = useSupabaseUser();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.png" alt="V-Tuune" width={32} height={32} />
        <h1 className="font-bold">V-Tuune</h1>
      </Link>

      {!loading && (
        <>
          {user ? (
            <div className="flex items-center gap-3">
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
