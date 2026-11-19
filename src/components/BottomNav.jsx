"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { useUnread } from "@/lib/unread";

const TABS = [
  { href: "/", label: "Discover", icon: "🧭" },
  { href: "/runs", label: "My runs", icon: "🏃" },
  { href: "/post", label: "Post", icon: "➕" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

// Fixed bottom tab bar, the web equivalent of pacer-native's tab navigator.
// Discover stays reachable either way (browsing is public); Post and Profile
// only show once signed in, Sign in shows instead when signed out.
export default function BottomNav() {
  const pathname = usePathname();
  const { loading } = useAuth();
  const { total: unreadTotal } = useUnread();
  const tabs = TABS;

  if (loading) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-bg-elevated">
      <div className="mx-auto max-w-[430px] flex">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(`${tab.href}/`)) ||
            (tab.alsoActive ?? []).includes(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 relative"
            >
              <span className={`text-[18px] leading-none ${active ? "" : "opacity-60"}`}>{tab.icon}</span>
              {tab.href === "/runs" && unreadTotal > 0 && (
                <span
                  aria-label={`${unreadTotal} new messages`}
                  className="absolute top-1.5 left-1/2 ml-2 min-w-[16px] h-4 px-1 rounded-full bg-accent text-bg text-[10px] font-bold flex items-center justify-center"
                >
                  {unreadTotal > 9 ? "9+" : unreadTotal}
                </span>
              )}
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
