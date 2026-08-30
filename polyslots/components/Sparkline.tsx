import { sparklinePath } from "@/lib/history";

/**
 * The market's recent price, drawn on the ticket.
 *
 * Renders nothing when there's no history — a missing sparkline should look
 * like a ticket without one, not like a broken chart.
 */
export function Sparkline({
  values,
  width = 240,
  height = 44,
  tone = "ink",
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: "ink" | "yes" | "no";
}) {
  if (!values || values.length < 2) return null;

  const d = sparklinePath(values, width, height);
  if (!d) return null;

  const stroke = tone === "yes" ? "#1B7F52" : tone === "no" ? "#B8332A" : "#241A12";
  const first = values[0];
  const last = values[values.length - 1];
  const move = Math.round((last - first) * 100);

  return (
    <div className="spark">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="spark-legend">
        <span>past week</span>
        <span>
          {move === 0 ? "flat" : `${move > 0 ? "+" : ""}${move}¢`}
        </span>
      </div>
    </div>
  );
}
