"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthProvider";

// "New messages" markers. Needs the 0007 SQL; before that runs, everything here
// quietly returns nothing so the app keeps working.
export const UNREAD_EVENT = "twenderun:unread";

export async function fetchUnread() {
  try {
    const { data, error } = await supabase.rpc("unread_counts");
    if (error) throw error;
    const map = {};
    for (const r of data ?? []) map[r.run_id] = Number(r.unread);
    return map;
  } catch {
    return {};
  }
}

// Called when someone has the run's chat open: everything up to now is read.
export async function markRead(userId, runId) {
  try {
    await supabase
      .from("run_reads")
      .upsert(
        { user_id: userId, run_id: runId, last_read_at: new Date().toISOString() },
        { onConflict: "user_id,run_id" }
      );
    window.dispatchEvent(new Event(UNREAD_EVENT));
  } catch {
    // Not critical.
  }
}

// { [runId]: unreadCount } for the signed-in person, refreshed every 25 seconds
// and whenever a chat is read.
export function useUnread() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({});

  const refresh = useCallback(() => {
    if (!user) return;
    fetchUnread().then(setCounts);
  }, [user]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 25000);
    window.addEventListener(UNREAD_EVENT, refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener(UNREAD_EVENT, refresh);
    };
  }, [refresh]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, total };
}
