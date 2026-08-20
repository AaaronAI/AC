import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Polymarket Slots",
  description:
    "Pull the lever, get a real prediction market with a tight order book, and take the bet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
