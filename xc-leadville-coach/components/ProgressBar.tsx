export function ProgressBar({
  value,
  min,
  max,
  label,
  unit,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
}) {
  const pct = Math.max(0, Math.min(100, ((value - 0) / max) * 100));
  const inRange = value >= min && value <= max;
  const color = inRange ? "bg-topo-ok" : value < min ? "bg-topo-warn" : "bg-topo-ember";
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-mute mb-1">
        <span>{label}</span>
        <span>
          {Math.round(value)} / {min}–{max} {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#1a221c] overflow-hidden border border-[#1f2a23]">
        <div className={`h-full ${color}`} style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}
