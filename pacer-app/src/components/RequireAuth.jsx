"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

// Wraps a page that needs a signed-in user (Post a Run, Profile). Discover
// itself stays public on purpose, browsing shouldn't require an account,
// but acting (posting, joining, editing a profile) should.
export default function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/sign-in");
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted text-[13px]">
        {loading ? "Loading..." : "Redirecting to sign in..."}
      </div>
    );
  }

  return children;
}
