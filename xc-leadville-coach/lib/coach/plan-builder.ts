// Adaptive weekly plan builder.
// Defaults follow the build curve, then adjust for trips, race phase, and recent load.

import type { WeeklyPlan, WeeklyPlanWorkout } from "./types";
import type { StravaDerived } from "@/lib/knowledge/strava";
import { eventsInRange, isInTrip } from "@/lib/knowledge/calendar";
import { daysUntilRace, racePhase } from "@/lib/knowledge/race";

type Day = WeeklyPlanWorkout["day"];
const DAYS: Day[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const PHASE_TARGETS: Record<string, { mi: [number, number]; ft: [number, number] }> = {
  base: { mi: [80, 110], ft: [8000, 13000] },
  build: { mi: [105, 135], ft: [11000, 17000] },
  "peak-build": { mi: [95, 130], ft: [10000, 17000] },
  taper: { mi: [60, 85], ft: [5000, 9000] },
  "race-week": { mi: [25, 40], ft: [2000, 4000] },
  "race-day": { mi: [50, 55], ft: [7000, 8000] },
};

function mondayOf(d: Date): Date {
  const m = new Date(d);
  const dow = (m.getDay() + 6) % 7;
  m.setDate(m.getDate() - dow);
  m.setHours(0, 0, 0, 0);
  return m;
}

export function buildWeek(today: Date, derived: StravaDerived): WeeklyPlan {
  const monday = mondayOf(today);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const phase = racePhase(today);
  const tgt = PHASE_TARGETS[phase] ?? PHASE_TARGETS.base;
  const events = eventsInRange(monday, sunday);
  const warnings: string[] = [];

  // Default scaffold: Mon recovery, Tue volleyball+strength, Wed mid-massive,
  // Thu quality, Fri easy, Sat massive, Sun easy/strength.
  const workouts: WeeklyPlanWorkout[] = DAYS.map((day, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    return {
      day,
      date: date.toISOString().slice(0, 10),
      kind: "rest",
      title: "Rest",
    };
  });

  const set = (day: Day, w: Omit<WeeklyPlanWorkout, "day" | "date">) => {
    const i = DAYS.indexOf(day);
    workouts[i] = { ...workouts[i], ...w };
  };

  set("mon", { kind: "recovery", title: "Recovery walk + mobility", note: "Protect tomorrow's quality." });
  set("tue", { kind: "quality", title: "Quality climbs — Green Mountain 3×8' tempo", targetMi: 14, targetFt: 1800, routeId: "green-mountain", note: "Volleyball after — count as load." });
  set("wed", { kind: "mid-massive", title: "Mid-massive: Home 35 (Green / Dakota / Matthews / Bear Creek)", targetMi: 35, targetFt: 4200, routeId: "home-35-loop" });
  set("thu", { kind: "quality", title: "Punchy 5×3' on Apex or Green", targetMi: 16, targetFt: 2200, routeId: "apex" });
  set("fri", { kind: "recovery", title: "Spin + 30 min strength (until mid-June)", note: "Pre-massive primer." });
  set("sat", { kind: "massive", title: "Massive: Buffalo Creek anchor", targetMi: 50, targetFt: 6500, routeId: "buffalo-creek" });
  set("sun", { kind: "endurance", title: "Easy Z2 + core", targetMi: 18, targetFt: 1500, routeId: "north-table" });

  // Phase adjustments
  if (phase === "race-week") {
    set("mon", { kind: "recovery", title: "Easy spin, legs open" });
    set("tue", { kind: "quality", title: "Race openers: 3×2' build", targetMi: 12, targetFt: 1000 });
    set("wed", { kind: "recovery", title: "Easy 45 min spin" });
    set("thu", { kind: "rest", title: "Travel + rest" });
    set("fri", { kind: "recovery", title: "Pre-ride: 30 min easy + 3×1' openers" });
    set("sat", { kind: "rest", title: "Race-eve: feet up, fuel, sleep" });
    set("sun", { kind: "race", title: "Silver Rush 50 — race day" });
    warnings.push("Race week: no PR hunts. Quality over quantity.");
  }
  if (phase === "taper") {
    set("sat", { kind: "mid-massive", title: "Mid-massive: cap at 38 mi", targetMi: 35, targetFt: 4000, routeId: "home-35-loop" });
    warnings.push("Taper: cut volume ~25% from peak-build, keep neuromuscular signal.");
  }

  // Trips
  for (const e of events) {
    if (e.id === "breck-dillon") {
      set("wed", { kind: "rest", title: "Travel to Summit County" });
      set("thu", { kind: "endurance", title: "Altitude open: Breck spin", targetMi: 18, targetFt: 1800, routeId: "breck-dillon-frisco", note: "Acclimate. Drink up." });
      set("fri", { kind: "mid-massive", title: "Frisco/Dillon altitude mid-massive", targetMi: 32, targetFt: 4000, routeId: "breck-dillon-frisco" });
      set("sat", { kind: "massive", title: "Altitude massive — Breck big loop", targetMi: 48, targetFt: 6500, routeId: "breck-dillon-frisco" });
      set("sun", { kind: "endurance", title: "Easy Frisco rec path home", targetMi: 16, targetFt: 600 });
      warnings.push("Altitude block: hydrate, eat aggressively, expect higher HR.");
    }
    if (e.id === "jersey-shore") {
      for (const d of DAYS) set(d, { kind: "rest", title: "Travel — walks + bodyweight" });
      set("sat", { kind: "endurance", title: "If a bike is available: 60–90 min easy" });
      warnings.push("Jersey deload week: maintain w/ walks + short spins. Don't chase mileage on return.");
    }
  }

  // Recent-load adjustments
  if (derived.fatigueRisk === "high") {
    warnings.push(`Last 7d shows high systemic load (${Math.round(derived.rolling7Ft)} ft, ${derived.hardDayCount7} hard days). Trimming volume before intensity.`);
    set("thu", { kind: "recovery", title: "Recovery spin (volume cut, intensity kept)" });
  }
  if (derived.fatigueRisk === "medium") {
    warnings.push("Yellow load. Hold quality, watch for two-day stack.");
  }

  // Trip-aware single override for today if traveling
  const trip = isInTrip(today);
  if (trip?.kind === "block-travel") {
    warnings.push(`On trip: ${trip.title}. Plan above is theoretical — execute light.`);
  }

  return {
    weekStart: monday.toISOString().slice(0, 10),
    phase,
    targetMiRange: tgt.mi,
    targetFtRange: tgt.ft,
    workouts,
    warnings,
  };
}

export function todayWorkout(plan: WeeklyPlan, today: Date): WeeklyPlanWorkout {
  const todayKey = today.toISOString().slice(0, 10);
  return plan.workouts.find((w) => w.date === todayKey) ?? plan.workouts[0];
}
