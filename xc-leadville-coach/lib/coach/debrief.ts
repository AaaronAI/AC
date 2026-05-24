// Post-ride debrief synthesizer.

import type { Ride } from "@/lib/knowledge/strava";

export type Debrief = {
  trained: string;
  fatigueCost: 1 | 2 | 3 | 4 | 5;
  matchedPlan: boolean | "partial";
  pacingNote: string;
  fuelingNote: string;
  tomorrow: string;
  improvement: string;
};

export function debrief(ride: Ride, plannedKind?: "massive" | "mid-massive" | "quality" | "endurance" | "recovery"): Debrief {
  const minutes = ride.movingS / 60;
  const trained = ride.massive
    ? "Anchor aerobic + climbing stress. The big rock for the week."
    : ride.midMassive
      ? "Solid mid-massive aerobic with climbing volume."
      : ride.elevationFt / Math.max(1, ride.distanceMi) > 100
        ? "Climbing-rich quality session."
        : "Aerobic / recovery work.";

  const matched: Debrief["matchedPlan"] =
    !plannedKind ? "partial"
      : (plannedKind === "massive" && ride.massive) ? true
      : (plannedKind === "mid-massive" && ride.midMassive) ? true
      : (plannedKind === "recovery" && !ride.hardDay) ? true
      : "partial";

  const pacingNote = ride.avgHr
    ? `Avg HR ${ride.avgHr} bpm over ${Math.round(minutes)} min. ${minutes > 120 && ride.avgHr > 160 ? "Drift suggests you cooked the middle — practice negative splits." : "Pacing looked controlled."}`
    : `No HR — feel-based check: did the last 30 min match the first 30?`;

  const carbsPerHr = ride.kcal ? Math.round((ride.kcal * 0.6) / Math.max(1, minutes / 60)) : 0;
  const fuelingNote = minutes >= 120
    ? `Over 2h: target 60–90g carbs/hr. ${carbsPerHr ? `Estimated burn ≈ ${carbsPerHr} kcal/hr fuel demand.` : "Log intake to compare."}`
    : "Under 2h: water + light fuel is enough.";

  const tomorrow = ride.massive
    ? "Tomorrow is recovery unless you're trying to give the fitness back."
    : ride.midMassive
      ? "Tomorrow: easy spin or quality, not back-to-back hard."
      : "Tomorrow: stay on plan.";

  const improvement = ride.massive
    ? "Lock in fueling cadence at every 25 min — set a watch alarm."
    : ride.midMassive
      ? "Hold a smoother climbing cadence in the second half."
      : "Strict Z2 on Z2 days — discipline beats heroics.";

  return {
    trained,
    fatigueCost: ride.fatigueCost,
    matchedPlan: matched,
    pacingNote,
    fuelingNote,
    tomorrow,
    improvement,
  };
}
