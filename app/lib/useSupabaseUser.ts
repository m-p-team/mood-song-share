"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { User } from "@supabase/supabase-js";
import { syncUserToAppTable } from "./userService";

// Events that indicate a user just became authenticated for the first time
// (initial page load or explicit sign-in). Token refresh / user updates
// must NOT trigger a users table sync — doing so on every token refresh
// would give syncUserToAppTable more chances to accidentally overwrite data.
const SYNC_EVENTS = new Set(["INITIAL_SESSION", "SIGNED_IN"]);

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fast initial read — does NOT trigger sync (onAuthStateChange handles that)
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only sync on sign-in / initial session — not on TOKEN_REFRESHED, USER_UPDATED, etc.
      if (session?.user && SYNC_EVENTS.has(event)) {
        syncUserToAppTable(session.user);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
