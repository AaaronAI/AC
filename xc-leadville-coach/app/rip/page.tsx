"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Section } from "@/components/Section";
import { LightBadge } from "@/components/ReadinessBadge";
import { useRides, useReadiness, useWeather } from "@/lib/store";
import { deriveStrava } from "@/lib/knowledge/strava";
import { scoreReadiness } from "@/lib/knowledge/readiness";
import { decideRip } from "@/lib/coach/rip-decision";
import { routesForUse, findRoute } from "@/lib/knowledge/routes";
import { buildWeek, todayWorkout } from "@/lib/coach/plan-builder";

type Intent = "as-planned" | "massive" | "mid-massive" | "quality" | "recovery";

export default function RipPage() {
  const today = useMemo(() => new Date(), []);
  const { rides } = useRides();
  const { readiness } = useReadiness();
  const { weather } = useWeather();
  const derived = useMemo(() => deriveStrava(rides, today), [rides, today]);
  const readinessScore = readiness ? scoreReadiness(readiness) : undefined;
  const [intent, setIntent] = useState<Intent>("as-planned");

  const plan = useMemo(() => buildWeek(today, derived), [today, derived]);
  const planned = todayWorkout(plan, today);

  const candidates = useMemo(() => {
    const useKey = intent === "as-planned"
      ? (planned.kind === "massive" ? "massive"
        : planned.kind === "mid-massive" ? "mid-massive"
        : planned.kind === "quality" ? "quality"
        : "endurance")
      : intent;
    return routesForUse(useKey as any);
  }, [intent, planned.kind]);

  const decision = useMemo(
    () => decideRip({ today, rides, derived, readiness, readinessScore, weather, calendar: [], candidateRoutes: candidates }),
    [today, rides, derived, readiness, readinessScore, weather, candidates]
  );

  const verdict =
    decision.light === "green" ? "SEND IT"
      : decision.light === "yellow" ? "MODIFY IT"
      : "ABSOLUTELY NOT";

  return (
    <div className="space-y-4">
      <Section>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-mute mb-1">Can I rip today?</div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{verdict}</h1>
            <p className="text-sm text-ink-mute mt-2">{decision.headline}</p>
          </div>
          <LightBadge light={decision.light} />
        </div>
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#1f2a23] p-3">
            <div className="text-xs uppercase text-ink-mute mb-1">Workout</div>
            <p className="text-sm">{decision.workout}</p>
          </div>
          <div className="rounded-xl border border-[#1f2a23] p-3">
            <div className="text-xs uppercase text-ink-mute mb-1">Fueling</div>
            <p className="text-sm">{decision.fueling}</p>
          </div>
        </div>
      </Section>

      <Section title="Why">
        <ul className="space-y-1 text-sm">
          {decision.why.map((w, i) => (
            <li key={i}>• {w}</li>
          ))}
        </ul>
        {decision.avoid.length > 0 && (
          <>
            <div className="dotline my-3" />
            <div className="text-xs uppercase text-ink-mute mb-1">Avoid</div>
            <ul className="space-y-1 text-sm">
              {decision.avoid.map((a, i) => (
                <li key={i} className="text-topo-ember">✗ {a}</li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-3 flex flex-wrap gap-1">
          {decision.citations.map((c) => (
            <span key={c} className="pill">{c}</span>
          ))}
        </div>
      </Section>

      <Section title="Re-ask the coach">
        <div className="flex flex-wrap gap-2">
          {(["as-planned", "massive", "mid-massive", "quality", "recovery"] as Intent[]).map((it) => (
            <button
              key={it}
              onClick={() => setIntent(it)}
              className={"btn " + (intent === it ? "btn-primary" : "")}
            >
              {it.replace("-", " ")}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-mute mt-3">
          Suggested routes for intent <span className="pill">{intent}</span>:
        </p>
        <ul className="mt-2 grid md:grid-cols-2 gap-2">
          {candidates.slice(0, 6).map((r) => (
            <li key={r.id} className="rounded-lg border border-[#1f2a23] px-3 py-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{r.name}</span>
                <span className="text-ink-mute text-xs">fatigue {r.fatigueCost}/5</span>
              </div>
              <div className="text-xs text-ink-mute mt-0.5">
                {r.typicalMileage[0]}–{r.typicalMileage[1]} mi · {r.typicalElevationFt[0].toLocaleString()}–{r.typicalElevationFt[1].toLocaleString()} ft
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid grid-cols-3 gap-2">
          <Link href="/checkin" className="btn">Log check-in</Link>
          <Link href="/log-ride" className="btn">Log ride</Link>
          <Link href="/coach" className="btn">Ask coach</Link>
        </div>
      </Section>
    </div>
  );
}
