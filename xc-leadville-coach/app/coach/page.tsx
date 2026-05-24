"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Section } from "@/components/Section";
import { useRides, useReadiness, useWeather, useChat, type ChatMsg } from "@/lib/store";
import { deriveStrava } from "@/lib/knowledge/strava";
import { scoreReadiness } from "@/lib/knowledge/readiness";
import { answer } from "@/lib/coach/reasoner";
import { ROUTES } from "@/lib/knowledge/routes";

const QUICK = [
  "Can I rip today?",
  "Legs feel cooked",
  "Should I move my big day?",
  "Should I rest or ride?",
  "Weather looks bad — what now?",
  "I want to do the 35-mile Green/Dakota/Matthews/Bear Creek loop",
  "Can I do Buff Creek tomorrow?",
];

export default function CoachPage() {
  return (
    <Suspense fallback={<div className="text-ink-mute text-sm">loading coach…</div>}>
      <CoachInner />
    </Suspense>
  );
}

function CoachInner() {
  const sp = useSearchParams();
  const today = useMemo(() => new Date(), []);
  const { rides } = useRides();
  const { readiness } = useReadiness();
  const { weather } = useWeather();
  const derived = useMemo(() => deriveStrava(rides, today), [rides, today]);
  const readinessScore = readiness ? scoreReadiness(readiness) : undefined;
  const { msgs, setMsgs, clear } = useChat();
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const ask = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMsg = { role: "user", content: text, ts: Date.now() };
    const decision = answer(text, {
      today,
      rides,
      derived,
      readiness,
      readinessScore,
      weather,
      calendar: [],
      candidateRoutes: ROUTES,
    });
    const coachMsg: ChatMsg = {
      role: "coach",
      content: `${decision.headline}\n\n${decision.workout}\n\nWhy:\n${decision.why.map((w) => `• ${w}`).join("\n")}${
        decision.avoid.length ? `\n\nAvoid:\n${decision.avoid.map((a) => `✗ ${a}`).join("\n")}` : ""
      }\n\nFueling: ${decision.fueling}\nRecovery: ${decision.recovery}`,
      citations: decision.citations,
      ts: Date.now(),
    };
    setMsgs([...msgs, userMsg, coachMsg]);
    setInput("");
  };

  useEffect(() => {
    const q = sp.get("ask");
    if (q && msgs.length === 0) ask(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [msgs]);

  return (
    <div className="space-y-4">
      <Section title="Coach chat" right={<button className="text-xs text-ink-mute hover:text-ink-base" onClick={clear}>clear</button>}>
        <div ref={scrollerRef} className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {msgs.length === 0 && (
            <p className="text-sm text-ink-mute">
              Ask anything about today. The coach retrieves facts from rider, race, routes, rules, calendar, Strava, readiness, and weather before answering.
            </p>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={"rounded-xl border p-3 " + (m.role === "user" ? "border-[#1f2a23] bg-[#11171392]" : "border-topo-accent/30 bg-topo-accent/5") }>
              <div className="text-[11px] uppercase tracking-wider text-ink-mute mb-1">
                {m.role === "user" ? "you" : "coach"}
              </div>
              <p className="whitespace-pre-wrap text-sm">{m.content}</p>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.citations.map((c) => (
                    <span key={c} className="pill">{c}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ask the coach..."
            className="flex-1 bg-[#11171392] border border-[#1f2a23] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-topo-accent/50"
          />
          <button className="btn btn-primary" type="submit">Ask</button>
        </form>
      </Section>

      <Section title="Quick asks">
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button key={q} onClick={() => ask(q)} className="btn text-xs">{q}</button>
          ))}
        </div>
      </Section>
    </div>
  );
}
