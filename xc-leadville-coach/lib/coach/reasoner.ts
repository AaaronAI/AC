// Coach reasoner: retrieve-then-reason over the KILM knowledge layer.
// Used by the chat surface. Heuristic NLU here; swap in OpenAI when wired.

import type { CoachInputs, CoachDecision } from "./types";
import { decideRip } from "./rip-decision";
import { findRoute, routesForUse, ROUTES, type Route } from "@/lib/knowledge/routes";
import { TRAINING_RULES } from "@/lib/knowledge/rules";
import { daysUntilRace, racePhase } from "@/lib/knowledge/race";

type Intent =
  | { kind: "can-i-rip" }
  | { kind: "route-ok"; routeId: string }
  | { kind: "move-big-day" }
  | { kind: "legs-cooked" }
  | { kind: "weather" }
  | { kind: "rest-or-ride" }
  | { kind: "home-35" }
  | { kind: "what-now" };

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/can i rip|rip today|send it/.test(t)) return { kind: "can-i-rip" };
  if (/legs (feel|are) (cooked|dead|heavy|fried)|toast|wrecked/.test(t)) return { kind: "legs-cooked" };
  if (/move (my )?big day|move massive|shuffle/.test(t)) return { kind: "move-big-day" };
  if (/weather|storm|rain/.test(t)) return { kind: "weather" };
  if (/rest or ride|should i rest/.test(t)) return { kind: "rest-or-ride" };
  if (/35[- ]?mile|home loop|green.*dakota.*matthews.*bear/.test(t)) return { kind: "home-35" };
  for (const r of ROUTES) {
    const name = r.name.toLowerCase();
    if (t.includes(name) || t.includes(r.id.replace(/-/g, " "))) {
      return { kind: "route-ok", routeId: r.id };
    }
  }
  if (/buff(alo)? ?creek/.test(t)) return { kind: "route-ok", routeId: "buffalo-creek" };
  if (/staunton/.test(t)) return { kind: "route-ok", routeId: "staunton" };
  if (/green( mountain)?/.test(t)) return { kind: "route-ok", routeId: "green-mountain" };
  return { kind: "what-now" };
}

export function answer(text: string, inp: CoachInputs): CoachDecision {
  const intent = detectIntent(text);
  const d = daysUntilRace(inp.today);
  const phase = racePhase(inp.today);

  if (intent.kind === "can-i-rip") return decideRip(inp);

  if (intent.kind === "legs-cooked") {
    return {
      light: "red",
      headline: "Trust the signal. Rest today.",
      workout: "20-min walk + 8–12 min mobility. Food, water, sleep.",
      why: [
        "You self-reported cooked legs — that's the strongest readiness signal we have.",
        `Phase: ${phase} (T-${d} days). Recovery is faster than digging out of a hole.`,
        "Rule: when fatigued, cut volume before cutting intensity.",
      ],
      avoid: ["Any ride", "Volleyball if scheduled"],
      fueling: "Eat normally. Protein at every meal. Hydrate steady.",
      recovery: "Couch stretch, hamstrings, glute bridges, t-spine. 8+ hours tonight.",
      citations: ["rider", "rules:volume-before-intensity-cut", "readiness:self-report"],
    };
  }

  if (intent.kind === "move-big-day") {
    return {
      light: "yellow",
      headline: "Moving the big day is fine. Protect the long ride.",
      workout: "Shift massive to the next clean day with good weather and green readiness. Today: 60–90 min Z2.",
      why: [
        "Rule: never stack massive + mid-massive back-to-back.",
        "Rule: protect the long ride above all else.",
        `Race phase: ${phase}. We can rearrange days, not lose the anchor.`,
      ],
      avoid: ["Doing both massive and the originally-scheduled day"],
      fueling: "Fuel today's Z2 like Z2: water + a snack.",
      recovery: "Mobility 8–12 min before bed.",
      citations: ["rules:no-stack", "rules:protect-long-ride"],
    };
  }

  if (intent.kind === "weather") {
    if (!inp.weather) {
      return missingFact("weather", inp);
    }
    return {
      light: inp.weather.trailRisk === "high" ? "yellow" : "green",
      headline: `Weather: ${inp.weather.conditions}, ${inp.weather.highF}°F, trail risk ${inp.weather.trailRisk}.`,
      workout: inp.weather.trailRisk === "high"
        ? "Move tech routes off-deck. Buff Creek > Dakota when wet. Or move long day to a clearer slot."
        : "Plan stands.",
      why: [
        `High ${inp.weather.highF}°F / precip ${Math.round(inp.weather.precipChance * 100)}%.`,
        inp.weather.conditions === "tstorm" ? "T-storms — clear treeline by 11am." : "Conditions reasonable.",
      ],
      avoid: inp.weather.trailRisk === "high" ? ["Wet rock on Dakota", "Above-treeline after 11am if storms"] : [],
      fueling: "Adjust sodium up in heat (700–1000 mg/L).",
      recovery: "Hydrate post-ride; weigh before/after if dehydration suspected.",
      citations: ["weather"],
    };
  }

  if (intent.kind === "rest-or-ride") {
    return decideRip(inp);
  }

  if (intent.kind === "home-35") {
    const route = findRoute("home-35-loop")!;
    return {
      light: "green",
      headline: "Home 35 is the perfect mid-massive when readiness is green/yellow.",
      workout: `${route.name} — 32–38 mi, 3.5k–5k ft. Door-to-door anchor.`,
      why: [
        "Mid-massive fits this week's structure (one massive + one mid-massive).",
        "Route is bailout-friendly (Hayden / MW / park).",
        "Technical sections (Dakota) develop bike handling under fatigue — race-relevant.",
      ],
      avoid: ["Pairing with Buff Creek the next day"],
      fueling: "2 bottles, 60–80g carbs/hr, eat in the first 20 min.",
      recovery: "Protein within 60 min. Mobility on hip flexors + t-spine.",
      routeId: route.id,
      citations: ["rules:mid-massive-bounds", "route:home-35-loop"],
    };
  }

  if (intent.kind === "route-ok") {
    const route = findRoute(intent.routeId);
    if (!route) return unknownRoute(intent.routeId);
    return assessRoute(route, inp);
  }

  // Default: synthesize from today's state
  return decideRip(inp);
}

function assessRoute(route: Route, inp: CoachInputs): CoachDecision {
  const dr = inp.derived;
  const r = inp.readinessScore;
  const heavy = route.workoutUses.includes("massive") || route.fatigueCost >= 4;
  const cites = [`route:${route.id}`, "strava:derived", "rules"];

  let light: CoachDecision["light"] = "green";
  const reasons: string[] = [
    `${route.name}: ${route.typicalMileage[0]}–${route.typicalMileage[1]} mi, ${route.typicalElevationFt[0]}–${route.typicalElevationFt[1]} ft. Fatigue cost ${route.fatigueCost}/5.`,
  ];
  const avoid: string[] = [];

  if (r) {
    cites.push(`readiness:${r.band}`);
    if (r.band === "red") {
      light = "red";
      reasons.push(`Readiness ${r.score}/100 (red). Not today.`);
      avoid.push("Heavy fatigue-cost routes");
    } else if (r.band === "yellow" && heavy) {
      light = "yellow";
      reasons.push(`Readiness yellow + heavy route. Downgrade or move it.`);
    }
  }

  if (heavy && dr.lastMassiveAt) {
    const hours = (inp.today.getTime() - new Date(dr.lastMassiveAt).getTime()) / 36e5;
    if (hours < 48) {
      light = light === "green" ? "yellow" : light;
      reasons.push(`Last massive was ~${Math.round(hours)} h ago — too soon to stack.`);
      cites.push("rules:no-stack");
    }
  }

  if (inp.weather?.trailRisk === "high" && route.weatherSensitivity !== "low") {
    light = light === "green" ? "yellow" : light;
    reasons.push("Trail risk high for this terrain — swap to a drier route or push the day.");
    avoid.push("Wet technical sections");
  }

  const workout = heavy
    ? `${route.name} as the week's anchor (massive).`
    : `${route.name} as ${route.workoutUses[0]} session.`;

  return {
    light,
    headline:
      light === "green"
        ? `${route.name}: green light.`
        : light === "yellow"
          ? `${route.name}: yellow — make it count, don't make it cost.`
          : `${route.name}: not today.`,
    workout,
    why: reasons,
    avoid,
    fueling: heavy ? "70–90g carbs/hr, 2+ bottles, sodium per heat." : "60g carbs/hr, 1 bottle minimum.",
    recovery: "Protein in 60 min. Mobility before bed.",
    routeId: route.id,
    citations: cites,
  };
}

function unknownRoute(id: string): CoachDecision {
  return {
    light: "yellow",
    headline: "I don't have that route in the knowledge base.",
    workout: "Pick a known route or add this one to the catalog.",
    why: [`Route id "${id}" unknown — I won't guess at mileage or fatigue cost.`],
    avoid: [],
    fueling: "n/a",
    recovery: "n/a",
    citations: ["unknown:route"],
  };
}

function missingFact(domain: string, inp: CoachInputs): CoachDecision {
  return {
    light: "yellow",
    headline: `Need ${domain} data to answer cleanly.`,
    workout: "Hold until the fact is loaded.",
    why: [`No ${domain} fact available — coach refuses to guess.`],
    avoid: [],
    fueling: "n/a",
    recovery: "n/a",
    citations: [`missing:${domain}`],
  };
}

// expose for UI debug
export const KNOWLEDGE_RULES = TRAINING_RULES;
