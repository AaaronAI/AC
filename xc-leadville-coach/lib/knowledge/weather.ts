// KILM domain: weather facts
// Real impl will call NWS / Open-Meteo. Coach must never invent weather.

export type WeatherDay = {
  date: string; // ISO yyyy-mm-dd
  highF: number;
  lowF: number;
  precipChance: number; // 0..1
  windMph: number;
  conditions: "clear" | "partly-cloudy" | "cloudy" | "rain" | "tstorm" | "snow";
  trailRisk: "low" | "medium" | "high";
  source: "mock" | "open-meteo" | "nws";
  fetchedAt: string;
};

export function summarizeWeather(w: WeatherDay): string {
  const risk = w.trailRisk === "high" ? " — high trail risk" : "";
  return `${w.conditions}, ${w.highF}/${w.lowF}°F, ${Math.round(w.precipChance * 100)}% precip, ${w.windMph} mph wind${risk}`;
}
