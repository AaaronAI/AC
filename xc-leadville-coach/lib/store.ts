"use client";

import { useEffect, useState, useCallback } from "react";
import { MOCK_RIDES, MOCK_READINESS, MOCK_WEATHER } from "@/data/mock/rides";
import type { Ride } from "@/lib/knowledge/strava";
import type { Readiness } from "@/lib/knowledge/readiness";
import type { WeatherDay } from "@/lib/knowledge/weather";

const RIDES_KEY = "xclc.rides.v1";
const READY_KEY = "xclc.readiness.v1";
const WX_KEY = "xclc.weather.v1";
const CHAT_KEY = "xclc.chat.v1";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function useRides() {
  const [rides, setRides] = useState<Ride[]>(MOCK_RIDES);
  useEffect(() => setRides(load(RIDES_KEY, MOCK_RIDES)), []);
  const update = useCallback((next: Ride[]) => {
    setRides(next);
    save(RIDES_KEY, next);
  }, []);
  const reset = useCallback(() => update(MOCK_RIDES), [update]);
  return { rides, setRides: update, reset };
}

export function useReadiness() {
  const [r, setR] = useState<Readiness | null>(MOCK_READINESS);
  useEffect(() => setR(load<Readiness | null>(READY_KEY, MOCK_READINESS)), []);
  const update = useCallback((v: Readiness | null) => {
    setR(v);
    save(READY_KEY, v);
  }, []);
  return { readiness: r, setReadiness: update };
}

export function useWeather() {
  const [w, setW] = useState<WeatherDay | null>(MOCK_WEATHER);
  useEffect(() => setW(load<WeatherDay | null>(WX_KEY, MOCK_WEATHER)), []);
  const update = useCallback((v: WeatherDay | null) => {
    setW(v);
    save(WX_KEY, v);
  }, []);
  return { weather: w, setWeather: update };
}

export type ChatMsg = { role: "user" | "coach"; content: string; citations?: string[]; ts: number };

export function useChat() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  useEffect(() => setMsgs(load<ChatMsg[]>(CHAT_KEY, [])), []);
  const update = useCallback((v: ChatMsg[]) => {
    setMsgs(v);
    save(CHAT_KEY, v);
  }, []);
  const clear = useCallback(() => update([]), [update]);
  return { msgs, setMsgs: update, clear };
}
