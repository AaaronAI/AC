"use client";

import { useMemo } from "react";
import { Section } from "@/components/Section";
import { ProgressBar } from "@/components/ProgressBar";
import { useRides } from "@/lib/store";
import { deriveStrava } from "@/lib/knowledge/strava";
import { buildWeek } from "@/lib/coach/plan-builder";
import { findRoute } from "@/lib/knowledge/routes";
import { racePhase } from "@/lib/knowledge/race";

const KIND_STYLE: Record<string, string> = {
  massive: "border-topo-ember/40 bg-topo-ember/5",
  "mid-massive": "border-topo-accent/40 bg-topo-accent/5",
  quality: "border-yellow-500/40 bg-yellow-500/5",
  endurance: "border-emerald-500/30 bg-emerald-500/5",
  recovery: "border-cyan-500/30 bg-cyan-500/5",
  rest: "border-[#1f2a23] bg-transparent",
  strength: "border-purple-500/30 bg-purple-500/5",
  race: "border-topo-ember/60 bg-topo-ember/10",
};

export default function WeekPage() {
  const today = useMemo(() => new Date(), []);
  const { rides } = useRides();
  const derived = useMemo(() => deriveStrava(rides, today), [rides, today]);
  const plan = useMemo(() => buildWeek(today, derived), [today, derived]);
  const phase = racePhase(today);

  const targetMiMid = (plan.targetMiRange[0] + plan.targetMiRange[1]) / 2;
  const targetFtMid = (plan.targetFtRange[0] + plan.targetFtRange[1]) / 2;

  return (
    <div className="space-y-4">
      <Section
        title={`Week of ${plan.weekStart}`}
        right={<span className="badge">phase: {phase}</span>}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <ProgressBar
            label="Mileage"
            value={derived.weekMileage}
            min={plan.targetMiRange[0]}
            max={plan.targetMiRange[1]}
            unit="mi"
          />
          <ProgressBar
            label="Elevation"
            value={derived.weekElevation}
            min={plan.targetFtRange[0]}
            max={plan.targetFtRange[1]}
            unit="ft"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
          <Stat label="7d miles" value={`${Math.round(derived.rolling7Mi)}`} />
          <Stat label="7d ft" value={`${Math.round(derived.rolling7Ft).toLocaleString()}`} />
          <Stat label="14d miles" value={`${Math.round(derived.rolling14Mi)}`} />
          <Stat label="28d miles" value={`${Math.round(derived.rolling28Mi)}`} />
          <Stat label="Hard days (7d)" value={`${derived.hardDayCount7}`} />
          <Stat label="Massive (7d)" value={`${derived.massiveCount7}`} />
          <Stat label="Streak" value={`${derived.streakDays} d`} />
          <Stat label="Fatigue risk" value={derived.fatigueRisk} />
        </div>
        {plan.warnings.length > 0 && (
          <ul className="mt-4 space-y-1">
            {plan.warnings.map((w, i) => (
              <li key={i} className="text-xs text-topo-ember">▲ {w}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Plan">
        <ol className="grid gap-2">
          {plan.workouts.map((w) => {
            const route = w.routeId ? findRoute(w.routeId) : undefined;
            const today = w.date === new Date().toISOString().slice(0, 10);
            return (
              <li
                key={w.day}
                className={`rounded-xl border p-3 ${KIND_STYLE[w.kind] ?? ""} ${today ? "outline outline-1 outline-topo-accent" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 inline-block text-xs uppercase text-ink-mute">{w.day}</span>
                    <span className="text-xs text-ink-mute">{w.date}</span>
                  </div>
                  <span className="pill capitalize">{w.kind}</span>
                </div>
                <div className="mt-2 text-sm">{w.title}</div>
                <div className="text-xs text-ink-mute mt-1">
                  {w.targetMi ? `${w.targetMi} mi · ` : ""}
                  {w.targetFt ? `${w.targetFt.toLocaleString()} ft · ` : ""}
                  {route ? route.name : ""}
                </div>
                {w.note && <div className="text-xs text-ink-mute mt-1 italic">{w.note}</div>}
              </li>
            );
          })}
        </ol>
        <p className="text-[11px] text-ink-mute mt-3">
          Target this week (phase {phase}): ~{Math.round(targetMiMid)} mi · ~
          {Math.round(targetFtMid).toLocaleString()} ft.
        </p>
      </Section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#1f2a23] bg-[#11171392] px-3 py-2">
      <div className="text-[11px] uppercase text-ink-mute">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}
