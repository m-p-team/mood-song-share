import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
    console.log("process.env.NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const cookieStore = await cookies(); // ← 新仕様で await が必要

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (_) {
            // RSC では set が禁止される場面があるので try/catch が推奨
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (_) {}
        }
      }
    }
  );
}