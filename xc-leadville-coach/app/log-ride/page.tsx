"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Section } from "@/components/Section";
import { useRides } from "@/lib/store";
import { classifyRide, type Ride, type RideType } from "@/lib/knowledge/strava";
import { ROUTES } from "@/lib/knowledge/routes";
import { debrief } from "@/lib/coach/debrief";

const TYPES: RideType[] = ["mtb", "gravel", "road", "walk", "run", "volleyball", "other"];

export default function LogRidePage() {
  const router = useRouter();
  const { rides, setRides } = useRides();
  const [type, setType] = useState<RideType>("mtb");
  const [routeTag, setRouteTag] = useState<string>("green-mountain");
  const [distance, setDistance] = useState<number>(20);
  const [elevation, setElevation] = useState<number>(2000);
  const [moving, setMoving] = useState<number>(120);
  const [avgHr, setAvgHr] = useState<number>(150);

  const partial = {
    startedAt: new Date().toISOString(),
    type,
    routeTag,
    distanceMi: distance,
    elevationFt: elevation,
    movingS: moving * 60,
    elapsedS: Math.round(moving * 60 * 1.1),
    avgHr,
  };
  const tags = classifyRide(partial);
  const previewRide: Ride = { id: "preview", ...partial, ...tags };
  const d = debrief(previewRide);

  return (
    <div className="space-y-4">
      <Section title="Log ride">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as RideType)} className="bg-[#11171392] border border-[#1f2a23] rounded-lg px-3 py-2 text-sm w-full">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Route">
            <select value={routeTag} onChange={(e) => setRouteTag(e.target.value)} className="bg-[#11171392] border border-[#1f2a23] rounded-lg px-3 py-2 text-sm w-full">
              {ROUTES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <NumberField label="Distance (mi)" value={distance} onChange={setDistance} step={0.1} />
          <NumberField label="Elevation (ft)" value={elevation} onChange={setElevation} step={50} />
          <NumberField label="Moving (min)" value={moving} onChange={setMoving} step={5} />
          <NumberField label="Avg HR" value={avgHr} onChange={setAvgHr} step={1} />
        </div>

        <div className="dotline my-4" />
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div><span className="text-ink-mute">Fatigue cost:</span> {tags.fatigueCost}/5</div>
          <div><span className="text-ink-mute">Hard day:</span> {tags.hardDay ? "yes" : "no"}</div>
          <div><span className="text-ink-mute">Massive:</span> {tags.massive ? "yes" : "no"}</div>
          <div><span className="text-ink-mute">Mid-massive:</span> {tags.midMassive ? "yes" : "no"}</div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              const newRide: Ride = { ...previewRide, id: `r_${Date.now()}` };
              setRides([newRide, ...rides]);
              router.push("/");
            }}
          >
            Save ride
          </button>
          <button className="btn" onClick={() => router.back()}>Cancel</button>
        </div>
      </Section>

      <Section title="Post-ride debrief (preview)">
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <Info label="What this trained" value={d.trained} />
          <Info label="Pacing" value={d.pacingNote} />
          <Info label="Fueling" value={d.fuelingNote} />
          <Info label="Tomorrow" value={d.tomorrow} />
          <Info label="One thing to improve" value={d.improvement} />
        </div>
      </Section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase text-ink-mute mb-1">{label}</div>
      {children}
    </label>
  );
}
function NumberField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-[#11171392] border border-[#1f2a23] rounded-lg px-3 py-2 text-sm w-full"
      />
    </Field>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#1f2a23] p-3">
      <div className="text-[11px] uppercase text-ink-mute mb-1">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
