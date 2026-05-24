import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { RaceCountdown } from "@/components/RaceCountdown";

export const metadata: Metadata = {
  title: "XC Leadville Coach",
  description: "KILM-style XC / marathon MTB coaching cockpit.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b0f0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen pb-24 md:pb-0">
        <header className="sticky top-0 z-30 border-b border-[#1f2a23] bg-[#0b0f0c]/85 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-topo-accent shadow-[0_0_12px_rgba(74,222,128,0.7)]" />
              <span className="font-semibold tracking-tight">XC Leadville Coach</span>
            </Link>
            <RaceCountdown />
          </div>
          <div className="topo-divider" />
        </header>
        <main className="mx-auto max-w-5xl px-4 py-5 md:py-8">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
