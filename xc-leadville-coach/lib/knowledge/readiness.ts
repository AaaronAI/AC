// KILM domain: readiness facts
// Daily check-in becomes the green/yellow/red signal the coach uses to gate everything.

export type LegsFeel = "fresh" | "normal" | "heavy" | "dead";
export type ReadinessBand = "green" | "yellow" | "red";

export type Readiness = {
  date: string; // ISO yyyy-mm-dd
  sleepH: number;        // 0..12
  soreness: number;      // 0..10
  fatigue: number;       // 0..10
  motivation: number;    // 0..10
  stress: number;        // 0..10
  hunger: number;        // 0..10 (10 = ravenous/under-fueled)
  legs: LegsFeel;
  notes?: string;
};

export type ReadinessScore = {
  score: number; // 0..100
  band: ReadinessBand;
  reasons: string[];
};

export function scoreReadiness(r: Readiness): ReadinessScore {
  // Each component contributes to a 100-pt scale. Lower-is-better dimensions are flipped.
  const sleep = Math.min(20, (r.sleepH / 8) * 20); // 8h = full points
  const soreness = (10 - r.soreness) * 1.5;        // 0..15
  const fatigue = (10 - r.fatigue) * 2;            // 0..20
  const motivation = r.motivation * 1.5;           // 0..15
  const stress = (10 - r.stress) * 1.0;            // 0..10
  const hunger = (10 - r.hunger) * 0.5;            // 0..5
  const legsMap = { fresh: 15, normal: 11, heavy: 6, dead: 1 } as const;
  const legs = legsMap[r.legs];

  const score = Math.round(sleep + soreness + fatigue + motivation + stress + hunger + legs);
  const reasons: string[] = [];
  if (r.sleepH < 6) reasons.push(`Sleep low (${r.sleepH}h)`);
  if (r.soreness >= 7) reasons.push(`High soreness (${r.soreness}/10)`);
  if (r.fatigue >= 7) reasons.push(`High fatigue (${r.fatigue}/10)`);
  if (r.motivation <= 3) reasons.push(`Low motivation (${r.motivation}/10)`);
  if (r.legs === "heavy" || r.legs === "dead") reasons.push(`Legs feel ${r.legs}`);
  if (r.stress >= 7) reasons.push(`High stress (${r.stress}/10)`);
  if (reasons.length === 0) reasons.push("Vitals clean across the board.");

  const band: ReadinessBand = score >= 80 ? "green" : score >= 60 ? "yellow" : "red";
  return { score: Math.max(0, Math.min(100, score)), band, reasons };
}
