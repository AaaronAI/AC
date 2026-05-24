"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Section } from "@/components/Section";
import { ReadinessBadge, LightBadge } from "@/components/ReadinessBadge";
import { useRides, useReadiness, useWeather } from "@/lib/store";
import { deriveStrava } from "@/lib/knowledge/strava";
import { scoreReadiness } from "@/lib/knowledge/readiness";
import { buildWeek, todayWorkout } from "@/lib/coach/plan-builder";
import { decideRip } from "@/lib/coach/rip-decision";
import { fuelingFor } from "@/lib/coach/fueling";
import { RIDER } from "@/lib/knowledge/rider";
import { findRoute, routesForUse } from "@/lib/knowledge/routes";
import { isInTrip } from "@/lib/knowledge/calendar";
import { summarizeWeather } from "@/lib/knowledge/weather";

export default function TodayPage() {
  const today = useMemo(() => new Date(), []);
  const { rides } = useRides();
  const { readiness } = useReadiness();
  const { weather } = useWeather();
  const derived = useMemo(() => deriveStrava(rides, today), [rides, today]);
  const readinessScore = readiness ? scoreReadiness(readiness) : undefined;
  const plan = useMemo(() => buildWeek(today, derived), [today, derived]);
  const planned = todayWorkout(plan, today);
  const trip = isInTrip(today);

  const candidates = useMemo(() => {
    if (planned.kind === "massive") return routesForUse("massive");
    if (planned.kind === "mid-massive") return routesForUse("mid-massive");
    if (planned.kind === "quality") return routesForUse("quality");
    return routesForUse("endurance");
  }, [planned.kind]);

  const decision = useMemo(
    () =>
      decideRip({
        today,
        rides,
        derived,
        readiness,
        readinessScore,
        weather,
        calendar: [],
        candidateRoutes: candidates,
      }),
    [today, rides, derived, readiness, readinessScore, weather, candidates]
  );

  const route = planned.routeId ? findRoute(planned.routeId) : undefined;
  const fuel = fuelingFor(planned.kind, (planned.targetMi ?? 20) * 5, "warm");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Hero */}
      <Section className="md:col-span-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-mute mb-1">Today</div>
            <h1 className="text-xl md:text-2xl font-semibold leading-tight">
              {planned.title}
            </h1>
            <p className="text-ink-mute text-sm mt-1">
              {planned.targetMi ? `${planned.targetMi} mi · ` : ""}
              {planned.targetFt ? `${planned.targetFt.toLocaleString()} ft · ` : ""}
              {route ? route.area : "—"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {readinessScore && <ReadinessBadge band={readinessScore.band} score={readinessScore.score} />}
            <LightBadge light={decision.light} />
          </div>
        </div>
        {trip && (
          <p className="mt-3 text-xs text-topo-ember">
            ▲ {trip.title} — {trip.notes}
          </p>
        )}
      </Section>

      {/* Coach note */}
      <Section title="Coach note">
        <p className="text-sm">{decision.headline}</p>
        <p className="text-ink-mute text-sm mt-2">{decision.workout}</p>
        {decision.why.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-ink-mute">
            {decision.why.slice(0, 4).map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-1">
          {decision.citations.map((c) => (
            <span key={c} className="pill">{c}</span>
          ))}
        </div>
      </Section>

      {/* Weather */}
      <Section title="Weather">
        {weather ? (
          <>
            <p className="text-sm capitalize">{weather.conditions.replace("-", " ")}</p>
            <p className="text-ink-mute text-xs mt-1">{summarizeWeather(weather)}</p>
          </>
        ) : (
          <p className="text-ink-mute text-sm">Unknown — wire weather API.</p>
        )}
      </Section>

      {/* Fueling */}
      <Section title="Fueling target">
        {fuel ? (
          <div className="text-sm space-y-1">
            <p>
              <span className="text-ink-mute">Carbs:</span>{" "}
              {fuel.carbsPerHrG[0]}–{fuel.carbsPerHrG[1]} g/hr
            </p>
            <p>
              <span className="text-ink-mute">Fluid:</span>{" "}
              {fuel.fluidPerHrMl[0]}–{fuel.fluidPerHrMl[1]} mL/hr
            </p>
            <p>
              <span className="text-ink-mute">Sodium:</span> {fuel.sodiumNote}
            </p>
            <p className="text-xs text-ink-mute pt-2">{fuel.duringStart}</p>
            {fuel.caffeineNote && <p className="text-xs text-ink-mute">{fuel.caffeineNote}</p>}
          </div>
        ) : (
          <p className="text-ink-mute text-sm">Rest / strength day — eat normally.</p>
        )}
      </Section>

      {/* Route option */}
      <Section title="Route option">
        {route ? (
          <div>
            <p className="text-sm font-medium">{route.name}</p>
            <p className="text-xs text-ink-mute">{route.area}</p>
            <p className="text-xs text-ink-mute mt-2">
              {route.typicalMileage[0]}–{route.typicalMileage[1]} mi ·{" "}
              {route.typicalElevationFt[0].toLocaleString()}–
              {route.typicalElevationFt[1].toLocaleString()} ft · fatigue {route.fatigueCost}/5 · tech{" "}
              {route.technicalDemand}/5
            </p>
            <p className="text-xs mt-2">{route.notes}</p>
          </div>
        ) : (
          <p className="text-ink-mute text-sm">No route assigned. Pick from Routes.</p>
        )}
      </Section>

      {/* Recovery warning */}
      <Section title="Recovery / warning">
        <p className="text-sm">{decision.recovery}</p>
        {decision.avoid.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-topo-ember">
            {decision.avoid.map((a, i) => (
              <li key={i}>✗ {a}</li>
            ))}
          </ul>
        )}
      </Section>

      {/* Actions */}
      <Section title="Quick actions" className="md:col-span-2">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Link href="/rip" className="btn btn-primary">Can I rip today?</Link>
          <Link href="/checkin" className="btn">Log check-in</Link>
          <Link href="/log-ride" className="btn">Log ride</Link>
          <Link href="/coach" className="btn">Make it easier</Link>
          <Link href="/coach?ask=give%20me%20violence" className="btn btn-warn">Give me violence</Link>
        </div>
        <p className="text-[11px] text-ink-mute mt-3">
          Hello {RIDER.name}. Home trail: {RIDER.homeTrail}. Goal: {RIDER.objective.toLowerCase()}.
        </p>
      </Section>
    </div>
  );
}
