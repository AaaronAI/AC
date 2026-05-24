import type { Ride } from "@/lib/knowledge/strava";
import { classifyRide } from "@/lib/knowledge/strava";

function mk(partial: Omit<Ride, "id" | "hardDay" | "massive" | "midMassive" | "fatigueCost">, id: string): Ride {
  return { id, ...partial, ...classifyRide(partial) };
}

const today = new Date();
const days = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  d.setHours(8, 30, 0, 0);
  return d.toISOString();
};

export const MOCK_RIDES: Ride[] = [
  mk({ startedAt: days(1), type: "mtb", routeTag: "green-mountain", distanceMi: 12, elevationFt: 1500, movingS: 75 * 60, elapsedS: 85 * 60, avgHr: 152, suffer: 70, kcal: 950 }, "r1"),
  mk({ startedAt: days(2), type: "mtb", routeTag: "home-35-loop", distanceMi: 33, elevationFt: 4100, movingS: 200 * 60, elapsedS: 220 * 60, avgHr: 148, suffer: 180, kcal: 2400 }, "r2"),
  mk({ startedAt: days(3), type: "walk", distanceMi: 3, elevationFt: 150, movingS: 50 * 60, elapsedS: 55 * 60 }, "r3"),
  mk({ startedAt: days(4), type: "mtb", routeTag: "apex", distanceMi: 14, elevationFt: 1900, movingS: 90 * 60, elapsedS: 100 * 60, avgHr: 158, suffer: 110, kcal: 1100 }, "r4"),
  mk({ startedAt: days(6), type: "mtb", routeTag: "buffalo-creek", distanceMi: 48, elevationFt: 5800, movingS: 280 * 60, elapsedS: 320 * 60, avgHr: 150, suffer: 240, kcal: 3300 }, "r5"),
  mk({ startedAt: days(8), type: "mtb", routeTag: "green-mountain", distanceMi: 10, elevationFt: 1200, movingS: 62 * 60, elapsedS: 70 * 60, avgHr: 145, suffer: 55, kcal: 720 }, "r6"),
  mk({ startedAt: days(10), type: "mtb", routeTag: "centennial-cone", distanceMi: 22, elevationFt: 2600, movingS: 135 * 60, elapsedS: 150 * 60, avgHr: 153, suffer: 130, kcal: 1500 }, "r7"),
  mk({ startedAt: days(13), type: "mtb", routeTag: "staunton", distanceMi: 36, elevationFt: 4800, movingS: 220 * 60, elapsedS: 245 * 60, avgHr: 151, suffer: 200, kcal: 2600 }, "r8"),
  mk({ startedAt: days(15), type: "volleyball", distanceMi: 0, elevationFt: 0, movingS: 90 * 60, elapsedS: 110 * 60 }, "r9"),
  mk({ startedAt: days(17), type: "mtb", routeTag: "buffalo-creek", distanceMi: 52, elevationFt: 6200, movingS: 300 * 60, elapsedS: 340 * 60, avgHr: 149, suffer: 250, kcal: 3500 }, "r10"),
];

export const MOCK_READINESS = {
  date: today.toISOString().slice(0, 10),
  sleepH: 7.5,
  soreness: 4,
  fatigue: 4,
  motivation: 8,
  stress: 3,
  hunger: 4,
  legs: "normal" as const,
  notes: "Felt good on yesterday's home loop — small Achilles tightness.",
};

export const MOCK_WEATHER = {
  date: today.toISOString().slice(0, 10),
  highF: 78,
  lowF: 52,
  precipChance: 0.2,
  windMph: 8,
  conditions: "partly-cloudy" as const,
  trailRisk: "low" as const,
  source: "mock" as const,
  fetchedAt: new Date().toISOString(),
};
