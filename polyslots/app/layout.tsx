import type { Metadata } from "next";

import ProbabilityField from "@/components/ProbabilityField";

import "./globals.css";

export const metadata: Metadata = {
  title: "Polyslots",
  description:
    "A slot machine for prediction markets. Pull the handle, get a real market with a tight book, take the bet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ProbabilityField />
        {children}
      </body>
    </html>
  );
}
