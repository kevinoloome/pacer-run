"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, ensureSession } from "@/lib/AuthProvider";

// Wraps a page that needs a user (Post a Run, My runs, Profile). Visitors
// without an account get a guest account automatically, so nobody hits a wall.
export default function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      // No account needed: start a guest session. If guests are switched off
      // in Supabase, fall back to the sign-up page.
      ensureSession().catch(() => router.replace("/sign-up"));
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted text-[13px]">
        {loading ? "Loading..." : "Loading..."}
      </div>
    );
  }

  return children;
}
