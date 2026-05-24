"use client";

import { useState } from "react";
import { Section } from "@/components/Section";
import { ROUTES, type Route, type WorkoutUse } from "@/lib/knowledge/routes";

const USES: ("all" | WorkoutUse)[] = ["all", "massive", "mid-massive", "quality", "endurance", "recovery", "tempo", "altitude", "punchy"];

export default function RoutesPage() {
  const [filter, setFilter] = useState<"all" | WorkoutUse>("all");
  const list = filter === "all" ? ROUTES : ROUTES.filter((r) => r.workoutUses.includes(filter));
  return (
    <div className="space-y-4">
      <Section title="Routes knowledge base">
        <div className="flex flex-wrap gap-2 mb-3">
          {USES.map((u) => (
            <button key={u} onClick={() => setFilter(u)} className={"btn text-xs " + (filter === u ? "btn-primary" : "")}>
              {u}
            </button>
          ))}
        </div>
        <ul className="grid md:grid-cols-2 gap-3">
          {list.map((r) => <RouteCard key={r.id} r={r} />)}
        </ul>
      </Section>
    </div>
  );
}

function RouteCard({ r }: { r: Route }) {
  return (
    <li className="rounded-xl border border-[#1f2a23] p-3 bg-[#11171392]">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-xs text-ink-mute">{r.area}</div>
        </div>
        <div className="flex gap-1 flex-wrap justify-end max-w-[55%]">
          {r.workoutUses.map((u) => <span key={u} className="pill capitalize">{u}</span>)}
        </div>
      </div>
      <div className="text-xs text-ink-mute mt-2">
        {r.typicalMileage[0]}–{r.typicalMileage[1]} mi · {r.typicalElevationFt[0].toLocaleString()}–{r.typicalElevationFt[1].toLocaleString()} ft
      </div>
      <div className="text-xs text-ink-mute mt-1">
        fatigue {r.fatigueCost}/5 · tech {r.technicalDemand}/5 · weather sens {r.weatherSensitivity}
      </div>
      <p className="text-xs mt-2">{r.notes}</p>
      {r.bailouts.length > 0 && (
        <p className="text-[11px] text-ink-mute mt-1">
          bailouts: {r.bailouts.map((b) => `${b.name} (${b.mi}mi)`).join(", ")}
        </p>
      )}
    </li>
  );
}
