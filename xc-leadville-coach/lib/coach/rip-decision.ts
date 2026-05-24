// "Can I rip today?" — the killer decision.
// Retrieve every relevant fact, reason against training rules, return a verdict.

import type { CoachInputs, CoachDecision, Light } from "./types";
import { daysUntilRace, racePhase } from "@/lib/knowledge/race";
import { findRoute, routesForUse } from "@/lib/knowledge/routes";
import { isInTrip } from "@/lib/knowledge/calendar";

type Verdict = "send-it" | "modify-it" | "absolutely-not";

export function decideRip(inp: CoachInputs): CoachDecision {
  const d = daysUntilRace(inp.today);
  const phase = racePhase(inp.today);
  const r = inp.readinessScore;
  const dr = inp.derived;
  const trip = isInTrip(inp.today);
  const cites: string[] = ["rider", "race", "rules"];

  const reasons: string[] = [];
  const avoid: string[] = [];
  let verdict: Verdict = "send-it";
  let light: Light = "green";

  // Race-week gate
  if (phase === "race-week") {
    verdict = "modify-it";
    light = "yellow";
    reasons.push(`Race week (T-${d} d). Openers only — no PR hunts.`);
    avoid.push("Massive efforts");
    avoid.push("Anything over 90 min");
    cites.push("phase:race-week");
  }
  if (phase === "race-day") {
    verdict = "absolutely-not";
    light = "red";
    reasons.push("It's race day. The bike is the workout.");
  }

  // Readiness gate
  if (r) {
    cites.push(`readiness:${r.band}`);
    if (r.band === "red") {
      verdict = "absolutely-not";
      light = "red";
      reasons.push(`Readiness ${r.score}/100 (red). Rest today.`);
      reasons.push(...r.reasons.slice(0, 2));
      avoid.push("Any hard ride");
    } else if (r.band === "yellow" && verdict !== "absolutely-not") {
      verdict = "modify-it";
      light = "yellow";
      reasons.push(`Readiness ${r.score}/100 (yellow). Ride, but no PR hunting.`);
      reasons.push(...r.reasons.slice(0, 2));
      avoid.push("Massive day");
      avoid.push("Intervals to failure");
    } else if (r.band === "green" && verdict === "send-it") {
      reasons.push(`Readiness ${r.score}/100 — green light.`);
    }
  } else {
    reasons.push("No check-in yet today — log one for a sharper call.");
  }

  // Load gate (rolling)
  cites.push("strava:derived");
  if (dr.rolling7Ft > 15000 && verdict !== "absolutely-not") {
    verdict = "modify-it";
    light = light === "green" ? "yellow" : light;
    reasons.push(`Last 7d climbing already at ${Math.round(dr.rolling7Ft)} ft — high systemic load.`);
    avoid.push("Stacking another massive");
  }
  if (dr.rolling7Mi > 110 && verdict !== "absolutely-not") {
    verdict = verdict === "send-it" ? "modify-it" : verdict;
    light = light === "green" ? "yellow" : light;
    reasons.push(`Last 7d mileage at ${Math.round(dr.rolling7Mi)} mi — above weekly target.`);
  }

  // Stack rule
  if (dr.lastMassiveAt) {
    const hours = (inp.today.getTime() - new Date(dr.lastMassiveAt).getTime()) / 36e5;
    if (hours < 36) {
      verdict = "modify-it";
      light = light === "green" ? "yellow" : light;
      reasons.push(`Massive day was ~${Math.round(hours)} h ago — back-to-back blows up the week.`);
      avoid.push("Another massive or mid-massive today");
      cites.push("rule:no-stack");
    }
  }

  // Streak / hard-day cap
  if (dr.hardDayCount7 >= 3 && verdict !== "absolutely-not") {
    verdict = "modify-it";
    light = light === "green" ? "yellow" : light;
    reasons.push(`${dr.hardDayCount7} hard days in the last 7. Recovery is the cheap win here.`);
    cites.push("rule:protect-long-ride");
  }

  // Weather
  if (inp.weather) {
    cites.push("weather");
    if (inp.weather.trailRisk === "high") {
      verdict = "modify-it";
      light = light === "green" ? "yellow" : light;
      reasons.push(`Weather: ${inp.weather.conditions}, trail risk high — move tech routes off-deck.`);
      avoid.push("Dakota Ridge / Apex when wet");
    }
    if (inp.weather.conditions === "tstorm" && d > 0) {
      avoid.push("Above-treeline exposure after 11am");
    }
  }

  // Calendar
  if (trip) {
    cites.push(`calendar:${trip.id}`);
    if (trip.kind === "block-travel") {
      verdict = "modify-it";
      light = light === "green" ? "yellow" : light;
      reasons.push(`Traveling (${trip.title}) — short spin or walk only.`);
    }
    if (trip.kind === "block-altitude") {
      reasons.push(`Altitude block (${trip.title}) — Leadville-grade adaptation day.`);
    }
  }

  // Build workout + headline
  let workout: string;
  let headline: string;
  let routeId: string | undefined;

  if (verdict === "send-it") {
    headline = "green light. go rip, but fuel like a pro.";
    const candidates = inp.candidateRoutes.length ? inp.candidateRoutes : routesForUse("massive");
    routeId = candidates[0]?.id;
    const route = routeId ? findRoute(routeId) : undefined;
    workout = route
      ? `Massive day: ${route.name} — ${route.typicalMileage[0]}–${route.typicalMileage[1]} mi, ${route.typicalElevationFt[0]}–${route.typicalElevationFt[1]} ft.`
      : "Massive day: 45–60 mi / 5k–8k ft on best-fit route.";
  } else if (verdict === "modify-it") {
    headline = "yellow light. ride, but no PR hunting.";
    const mid = routesForUse("mid-massive")[0];
    routeId = mid?.id;
    workout = mid
      ? `Mid-massive: ${mid.name}, controlled aerobic. 28–40 mi / 3k–5.5k ft.`
      : "Aerobic ride, controlled effort, 28–40 mi / 3k–5.5k ft.";
  } else {
    headline = "red light. rest today. boring choice, fast outcome.";
    workout = "Active recovery: 20-min walk + 8–12 min mobility. No bike.";
  }

  const fueling =
    verdict === "send-it"
      ? "60–90g carbs/hr, 600–750 mL fluid/hr, eat in first 20 min, recovery meal within 60–90 min."
      : verdict === "modify-it"
        ? "40–60g carbs/hr, hydrate steady, eat within 45 min after."
        : "Eat normal meals. Protein at every meal. Hydrate without overdoing it.";

  const recovery =
    verdict === "absolutely-not"
      ? "Sleep 8+ hours tonight. Couch stretch, hamstrings, glute bridges, t-spine."
      : "Mobility 8–12 min before bed. Protein within 60 min of finishing.";

  return {
    light,
    headline,
    workout,
    why: reasons,
    avoid,
    fueling,
    recovery,
    routeId,
    citations: cites,
  };
}
