# XC Leadville Coach

A KILM (knowledge-injected) coaching cockpit for Aaron's road to the **Silver Rush 50 (Jul 12)** and Leadville-style XC / marathon MTB racing.

Mission: push training as hard as possible without blowing up.

## What it is

Strava + TrainingPeaks + Whoop + a ruthless smart XC coach — fused into one mobile-first PWA.

## KILM architecture

Every coach recommendation runs through a retrieve-then-reason pipeline over a structured knowledge layer:

1. Rider profile facts
2. Race knowledge (Silver Rush 50, Leadville)
3. Route knowledge (Green Mtn, Buff Creek, Staunton, Centennial Cone, ...)
4. Hard training rules
5. Calendar constraints
6. Strava-derived ride facts
7. Readiness check-in facts
8. Weather facts

The coach never answers from vibes. If a fact is unknown it says unknown.

## Core screens

- **Today** — daily cockpit (workout, readiness, weather, fueling, route, swap buttons)
- **Week** — adaptive weekly plan vs actual
- **Coach** — chat that cites the facts it reasoned from
- **Rip** — the killer "Can I rip today?" decision
- **Debrief** — post-ride synthesis

## Stack

Next.js · TypeScript · Tailwind · Recharts · (Supabase, OpenAI, Strava, Google Calendar, Weather — wired as integrations)

## Dev

```
npm install
npm run dev
```
Built mock-first; every integration boundary is typed so the live wiring is a swap, not a rewrite.
