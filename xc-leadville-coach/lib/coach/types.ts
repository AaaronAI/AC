import type { Ride, StravaDerived, Readiness, ReadinessScore, WeatherDay, Route, CalendarEvent } from "@/lib/knowledge";

export type Light = "green" | "yellow" | "red";

export type CoachInputs = {
  today: Date;
  rides: Ride[];
  derived: StravaDerived;
  readiness?: Readiness | null;
  readinessScore?: ReadinessScore;
  weather?: WeatherDay | null;
  calendar: CalendarEvent[];
  candidateRoutes: Route[];
};

export type CoachDecision = {
  light: Light;
  headline: string;
  workout: string;
  why: string[];          // cited facts
  avoid: string[];
  fueling: string;
  recovery: string;
  routeId?: string;
  citations: string[];    // knowledge-domain ids used
};

export type WeeklyPlanWorkout = {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  date: string;
  kind: "massive" | "mid-massive" | "quality" | "endurance" | "recovery" | "rest" | "strength" | "race";
  title: string;
  targetMi?: number;
  targetFt?: number;
  routeId?: string;
  note?: string;
};

export type WeeklyPlan = {
  weekStart: string; // ISO Monday
  phase: string;
  targetMiRange: [number, number];
  targetFtRange: [number, number];
  workouts: WeeklyPlanWorkout[];
  warnings: string[];
};
