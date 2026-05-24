"use client";

import { useEffect, useState } from "react";
import { daysUntilRace, SILVER_RUSH_50 } from "@/lib/knowledge/race";

export function RaceCountdown() {
  const [d, setD] = useState<number | null>(null);
  useEffect(() => setD(daysUntilRace(new Date())), []);
  if (d === null) return null;
  const label =
    d <= 0 ? "race day" : d === 1 ? "1 day" : `${d} days`;
  const cls =
    d <= 7 ? "badge-yellow" : d <= 28 ? "" : "badge-green";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-ink-mute hidden sm:inline">{SILVER_RUSH_50.name}</span>
      <span className={`badge ${cls}`}>T-{label}</span>
    </div>
  );
}
