// Fueling logic. Outputs targets for the planned workout.

export type FuelingPlan = {
  carbsPerHrG: [number, number];
  fluidPerHrMl: [number, number];
  sodiumNote: string;
  preRide: string;
  duringStart: string;
  postRide: string;
  bonkWarning: string;
  caffeineNote?: string;
};

export function fuelingFor(kind: "massive" | "mid-massive" | "quality" | "endurance" | "recovery" | "rest" | "strength" | "race", durationMinEstimate: number, heat: "cool" | "warm" | "hot" = "warm"): FuelingPlan | null {
  if (kind === "rest" || kind === "recovery" || kind === "strength") return null;
  const heavy = kind === "massive" || kind === "race";
  const c: [number, number] = heavy ? [70, 90] : [60, 80];
  const f: [number, number] = heavy ? [600, 850] : [500, 750];
  const sodium = heat === "hot" ? "700–1000 mg/L" : heat === "warm" ? "500–700 mg/L" : "300–500 mg/L";
  return {
    carbsPerHrG: durationMinEstimate >= 120 ? c : [40, 60],
    fluidPerHrMl: f,
    sodiumNote: sodium,
    preRide: "Real food 2–3h before, 30g carbs 30 min out.",
    duringStart: "Eat within the first 20 minutes — don't wait for hunger.",
    postRide: "Recovery meal within 60–90 min. Carbs + 25–35g protein.",
    bonkWarning: "If output drops + brain fog: 30–40g fast carbs now, then resume cadence.",
    caffeineNote: heavy ? "Optional: 100–200 mg caffeine ~60 min into the ride." : undefined,
  };
}
