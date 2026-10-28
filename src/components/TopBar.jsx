"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";

export default function TopBar() {
  const { session, isGuest, loading } = useAuth();
  const showSignIn = !loading && (!session || isGuest);
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-4">
      <div className="font-display font-bold text-xl">
        pacer<span className="text-accent">.</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-[12px] text-muted bg-bg-elevated border border-line rounded-full px-3 py-1.5">
          🌍 Worldwide
        </div>
        {showSignIn && (
          <Link
            href="/sign-in"
            className="text-[12px] font-semibold text-accent border border-accent/40 rounded-full px-3 py-1.5"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
