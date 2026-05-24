"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Section } from "@/components/Section";
import { ReadinessBadge } from "@/components/ReadinessBadge";
import { useReadiness } from "@/lib/store";
import { scoreReadiness, type Readiness, type LegsFeel } from "@/lib/knowledge/readiness";

const LEGS: LegsFeel[] = ["fresh", "normal", "heavy", "dead"];

export default function CheckinPage() {
  const router = useRouter();
  const { readiness, setReadiness } = useReadiness();
  const [r, setR] = useState<Readiness>(
    readiness ?? {
      date: new Date().toISOString().slice(0, 10),
      sleepH: 7.5,
      soreness: 3,
      fatigue: 3,
      motivation: 7,
      stress: 3,
      hunger: 3,
      legs: "normal",
      notes: "",
    }
  );
  const score = scoreReadiness(r);

  const update = <K extends keyof Readiness>(k: K, v: Readiness[K]) =>
    setR((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4">
      <Section title="Daily check-in" right={<ReadinessBadge band={score.band} score={score.score} />}>
        <div className="grid md:grid-cols-2 gap-4">
          <Slider label="Sleep (h)" min={0} max={12} step={0.5} value={r.sleepH} onChange={(v) => update("sleepH", v)} />
          <Slider label="Soreness" min={0} max={10} value={r.soreness} onChange={(v) => update("soreness", v)} />
          <Slider label="Fatigue" min={0} max={10} value={r.fatigue} onChange={(v) => update("fatigue", v)} />
          <Slider label="Motivation" min={0} max={10} value={r.motivation} onChange={(v) => update("motivation", v)} />
          <Slider label="Stress" min={0} max={10} value={r.stress} onChange={(v) => update("stress", v)} />
          <Slider label="Hunger (10 = ravenous)" min={0} max={10} value={r.hunger} onChange={(v) => update("hunger", v)} />
        </div>

        <div className="mt-4">
          <div className="text-xs uppercase text-ink-mute mb-2">Legs feel</div>
          <div className="flex gap-2">
            {LEGS.map((l) => (
              <button
                key={l}
                onClick={() => update("legs", l)}
                className={"btn capitalize " + (r.legs === l ? "btn-primary" : "")}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs uppercase text-ink-mute mb-2">Notes</div>
          <textarea
            value={r.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
            className="w-full bg-[#11171392] border border-[#1f2a23] rounded-lg px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div className="dotline my-4" />
        <div className="text-xs text-ink-mute space-y-1">
          {score.reasons.map((rs, i) => (
            <div key={i}>• {rs}</div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              setReadiness({ ...r, date: new Date().toISOString().slice(0, 10) });
              router.push("/");
            }}
          >
            Save check-in
          </button>
          <button className="btn" onClick={() => router.back()}>Cancel</button>
        </div>
      </Section>
    </div>
  );
}

function Slider({
  label, min, max, step = 1, value, onChange,
}: { label: string; min: number; max: number; step?: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-ink-mute mb-1">
        <span>{label}</span><span>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-topo-accent"
      />
    </div>
  );
}
