import type { ReadinessBand } from "@/lib/knowledge/readiness";

export function ReadinessBadge({ band, score }: { band: ReadinessBand; score?: number }) {
  const cls = band === "green" ? "badge-green" : band === "yellow" ? "badge-yellow" : "badge-red";
  const label = band.toUpperCase();
  return (
    <span className={`badge ${cls}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {label}
      {typeof score === "number" && <span className="text-ink-mute">· {score}</span>}
    </span>
  );
}

export function LightBadge({ light }: { light: "green" | "yellow" | "red" }) {
  return <ReadinessBadge band={light} />;
}
