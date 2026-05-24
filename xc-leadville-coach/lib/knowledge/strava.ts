// KILM domain: Strava facts
// Strava is the source of truth for completed training.
// In production, rides come from the Strava API + webhooks. Here we type the model
// and derive the rolling metrics the coach reasons against.

export type RideType = "mtb" | "gravel" | "road" | "walk" | "run" | "volleyball" | "other";
export type RouteTag = string;

export type Ride = {
  id: string;
  stravaId?: number;
  startedAt: string; // ISO
  type: RideType;
  routeTag?: RouteTag;
  distanceMi: number;
  elevationFt: number;
  movingS: number;
  elapsedS: number;
  avgHr?: number;
  suffer?: number;
  kcal?: number;
  polyline?: string;
  // derived
  hardDay: boolean;
  massive: boolean;
  midMassive: boolean;
  fatigueCost: 1 | 2 | 3 | 4 | 5;
};

export type StravaDerived = {
  weekMileage: number;
  weekElevation: number;
  rolling7Mi: number;
  rolling14Mi: number;
  rolling28Mi: number;
  rolling7Ft: number;
  rolling14Ft: number;
  rolling28Ft: number;
  streakDays: number;
  hardDayCount7: number;
  massiveCount7: number;
  midMassiveCount7: number;
  longestRideMi: number;
  biggestClimbFt: number;
  fatigueRisk: "low" | "medium" | "high";
  lastMassiveAt?: string;
  lastHardAt?: string;
};

const DAY = 24 * 60 * 60 * 1000;

export function deriveStrava(rides: Ride[], today: Date = new Date()): StravaDerived {
  const sorted = [...rides].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
  const within = (days: number) =>
    sorted.filter((r) => today.getTime() - new Date(r.startedAt).getTime() <= days * DAY);

  const sum = (rs: Ride[], k: "distanceMi" | "elevationFt") =>
    rs.reduce((a, r) => a + r[k], 0);

  const r7 = within(7);
  const r14 = within(14);
  const r28 = within(28);

  // streak: consecutive prior days with any activity
  let streak = 0;
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const haveByDay = new Set(sorted.map((r) => dayKey(new Date(r.startedAt))));
  const cursor = new Date(today);
  for (;;) {
    if (haveByDay.has(dayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
    if (streak > 60) break;
  }

  const massive7 = r7.filter((r) => r.massive).length;
  const mid7 = r7.filter((r) => r.midMassive).length;
  const hard7 = r7.filter((r) => r.hardDay).length;

  // weekly target gauge (calendar week, Mon-start)
  const weekStart = new Date(today);
  const day = (weekStart.getDay() + 6) % 7; // Mon=0
  weekStart.setDate(weekStart.getDate() - day);
  weekStart.setHours(0, 0, 0, 0);
  const weekRides = sorted.filter((r) => new Date(r.startedAt) >= weekStart);

  const lastMassive = sorted.find((r) => r.massive)?.startedAt;
  const lastHard = sorted.find((r) => r.hardDay)?.startedAt;

  let fatigueRisk: "low" | "medium" | "high" = "low";
  if (hard7 >= 3 || massive7 >= 2 || sum(r7, "elevationFt") > 15000) fatigueRisk = "high";
  else if (hard7 >= 2 || sum(r7, "distanceMi") > 110) fatigueRisk = "medium";

  return {
    weekMileage: sum(weekRides, "distanceMi"),
    weekElevation: sum(weekRides, "elevationFt"),
    rolling7Mi: sum(r7, "distanceMi"),
    rolling14Mi: sum(r14, "distanceMi"),
    rolling28Mi: sum(r28, "distanceMi"),
    rolling7Ft: sum(r7, "elevationFt"),
    rolling14Ft: sum(r14, "elevationFt"),
    rolling28Ft: sum(r28, "elevationFt"),
    streakDays: streak,
    hardDayCount7: hard7,
    massiveCount7: massive7,
    midMassiveCount7: mid7,
    longestRideMi: Math.max(0, ...sorted.map((r) => r.distanceMi)),
    biggestClimbFt: Math.max(0, ...sorted.map((r) => r.elevationFt)),
    fatigueRisk,
    lastMassiveAt: lastMassive,
    lastHardAt: lastHard,
  };
}

export function classifyRide(input: Omit<Ride, "id" | "hardDay" | "massive" | "midMassive" | "fatigueCost">): Pick<Ride, "hardDay" | "massive" | "midMassive" | "fatigueCost"> {
  const { distanceMi, elevationFt, type } = input;
  if (type === "walk" || type === "volleyball" || type === "other")
    return { hardDay: false, massive: false, midMassive: false, fatigueCost: 1 };

  const massive = distanceMi >= 45 && elevationFt >= 5000;
  const midMassive = !massive && distanceMi >= 28 && elevationFt >= 3000;
  const hardDay = massive || midMassive || (input.suffer ?? 0) >= 150;
  let fatigueCost: 1 | 2 | 3 | 4 | 5 = 1;
  if (massive) fatigueCost = 5;
  else if (midMassive) fatigueCost = 4;
  else if (distanceMi >= 20 || elevationFt >= 2000) fatigueCost = 3;
  else if (distanceMi >= 10) fatigueCost = 2;
  return { hardDay, massive, midMassive, fatigueCost };
}
