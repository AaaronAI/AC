// KILM domain: training rules
// Hard rules the coach enforces. Engine consumes these — never softens silently.

export type RuleSeverity = "hard" | "guideline" | "phase";
export type Rule = {
  id: string;
  severity: RuleSeverity;
  statement: string;
  rationale: string;
};

export const TRAINING_RULES: Rule[] = [
  {
    id: "one-massive-per-week",
    severity: "hard",
    statement: "Exactly one massive day per week.",
    rationale: "Two massive days reliably digs a hole. Volume wins; depth wins races.",
  },
  {
    id: "one-mid-massive-per-week",
    severity: "hard",
    statement: "Exactly one mid-massive day per week.",
    rationale: "Mid-massive carries the aerobic load between the anchor and the punchy sessions.",
  },
  {
    id: "massive-bounds",
    severity: "hard",
    statement: "Massive = 45–60 mi / 5k–8k ft.",
    rationale: "Race-prep weight. Outside this is junk or breakage.",
  },
  {
    id: "mid-massive-bounds",
    severity: "hard",
    statement: "Mid-massive = 55–70% of massive, typically 28–40 mi / 3k–5.5k ft.",
    rationale: "Heavy enough to matter, light enough to recover from before the anchor.",
  },
  {
    id: "no-stack",
    severity: "hard",
    statement: "Never schedule massive and mid-massive on back-to-back days.",
    rationale: "Stack = systemic fatigue spike. We pay later, with interest.",
  },
  {
    id: "no-chase-on-fatigue",
    severity: "hard",
    statement: "Do not chase missed mileage when readiness is yellow or red.",
    rationale: "The body remembers stress, not numbers on a screen.",
  },
  {
    id: "protect-long-ride",
    severity: "hard",
    statement: "Protect the long ride above all other sessions.",
    rationale: "It is the foundation of XC fitness.",
  },
  {
    id: "volume-before-intensity-cut",
    severity: "guideline",
    statement: "When fatigued, reduce volume before removing all intensity.",
    rationale: "Keep neuromuscular signal alive; cut the carrying cost.",
  },
  {
    id: "strict-taper",
    severity: "hard",
    statement: "Strict taper before race week. No PR hunts inside 14 days.",
    rationale: "Fitness is locked. Freshness is not.",
  },
  {
    id: "walking-is-load",
    severity: "guideline",
    statement: "Walking counts as low-intensity load.",
    rationale: "Time on feet adds up; ignore it and overshoot.",
  },
  {
    id: "volleyball-is-load",
    severity: "guideline",
    statement: "Tuesday-night volleyball counts as load.",
    rationale: "Sprints + jumps = real neuromuscular cost.",
  },
  {
    id: "strength-phase",
    severity: "phase",
    statement: "Strength 2x/wk until mid-June, 1x/wk thereafter, mobility only race week.",
    rationale: "Carry strength as long as we can, then peel it before the race.",
  },
];

export function rulesByIds(ids: string[]): Rule[] {
  return TRAINING_RULES.filter((r) => ids.includes(r.id));
}
