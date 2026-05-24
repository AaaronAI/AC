// KILM domain: race knowledge
// Facts about the goal race the coach reasons against.

export type RaceFacts = {
  id: string;
  name: string;
  date: string; // ISO
  priority: "A" | "B" | "C";
  demands: string[];
  prepNeeds: string[];
  startElevationFt: number;
  highPointFt: number;
  totalGainFt: number;
  distanceMi: number;
};

export const SILVER_RUSH_50: RaceFacts = {
  id: "silver-rush-50",
  name: "Silver Rush 50",
  date: "2026-07-12",
  priority: "A",
  demands: [
    "Long sustained climbs",
    "Altitude (10k–12k+ ft)",
    "Pacing discipline",
    "Mid-race fueling under fatigue",
    "Fatigue resistance over 4–6+ hours",
  ],
  prepNeeds: [
    "Long endurance volume",
    "Climbing-rich training",
    "Altitude exposure (Breck/Dillon/Frisco/Leadville)",
    "Technical efficiency on tired legs",
    "Practiced race-day fueling",
  ],
  startElevationFt: 10200,
  highPointFt: 12000,
  totalGainFt: 7800,
  distanceMi: 50,
};

export function daysUntilRace(today: Date = new Date()): number {
  const race = new Date(SILVER_RUSH_50.date + "T07:00:00-06:00");
  return Math.ceil((race.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function racePhase(today: Date = new Date()): RacePhase {
  const d = daysUntilRace(today);
  if (d <= 0) return "race-day";
  if (d <= 7) return "race-week";
  if (d <= 14) return "taper";
  if (d <= 28) return "peak-build";
  if (d <= 56) return "build";
  return "base";
}

export type RacePhase = "base" | "build" | "peak-build" | "taper" | "race-week" | "race-day";
