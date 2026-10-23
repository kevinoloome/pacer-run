"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

const TABS_SIGNED_IN = [
  { href: "/", label: "Discover", icon: "🧭" },
  { href: "/post", label: "Post", icon: "➕" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

const TABS_SIGNED_OUT = [
  { href: "/", label: "Discover", icon: "🧭" },
  { href: "/sign-in", label: "Sign in", icon: "👤" },
];

// Fixed bottom tab bar, the web equivalent of pacer-native's tab navigator.
// Discover stays reachable either way (browsing is public); Post and Profile
// only show once signed in, Sign in shows instead when signed out.
export default function BottomNav() {
  const pathname = usePathname();
  const { session, loading } = useAuth();
  const tabs = session ? TABS_SIGNED_IN : TABS_SIGNED_OUT;

  if (loading) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-bg-elevated">
      <div className="mx-auto max-w-[430px] flex">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5"
            >
              <span className={`text-[18px] leading-none ${active ? "" : "opacity-60"}`}>{tab.icon}</span>
              <span
                className={`text-[11px] font-medium ${active ? "text-accent" : "text-muted"}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
