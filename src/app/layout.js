import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthProvider";
import BottomNav from "@/components/BottomNav";
import Splash from "@/components/Splash";
import SafetyNote from "@/components/SafetyNote";
import AccountNudge from "@/components/AccountNudge";
import RegisterSW from "@/components/RegisterSW";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://app.twenderun.com"),
  title: "TwendeRun. Find your running partner.",
  description: "Find runners to run with in Kenya. Swipe, join, and run together.",
  openGraph: {
    title: "TwendeRun. Find your running partner.",
    description: "Find runners to run with in Kenya. Swipe, join, and run together.",
    siteName: "TwendeRun",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "TwendeRun", statusBarStyle: "black-translucent" },
};

export const viewport = { themeColor: "#12181D" };

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text font-body">
        <AuthProvider>
          <Splash />
          {children}
          <RegisterSW />
          <AccountNudge />
        <SafetyNote />
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
