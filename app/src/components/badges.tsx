import { formatState } from "@/lib/format";

const STATE_STYLES: Record<string, string> = {
  // listing
  DRAFT: "bg-line/60 text-ink-soft",
  SUBMITTED: "bg-warn-soft text-warn",
  UNDER_REVIEW: "bg-warn-soft text-warn",
  CHANGES_REQUESTED: "bg-danger-soft text-danger",
  APPROVED: "bg-ok-soft text-ok",
  LIVE: "bg-ok-soft text-ok",
  PAUSED: "bg-line/60 text-ink-soft",
  BOOKED: "bg-signal-soft text-signal-dark",
  COMPLETED: "bg-ok-soft text-ok",
  ARCHIVED: "bg-line/60 text-ink-soft",
  REJECTED: "bg-danger-soft text-danger",
  // campaign extras
  BRIEF_SUBMITTED: "bg-warn-soft text-warn",
  MATCHING: "bg-warn-soft text-warn",
  PROPOSALS_AVAILABLE: "bg-signal-soft text-signal-dark",
  OFFER_PENDING: "bg-signal-soft text-signal-dark",
  PAYMENT_AUTHORIZED: "bg-signal-soft text-signal-dark",
  PRE_PRODUCTION: "bg-warn-soft text-warn",
  APPROVAL_PENDING: "bg-warn-soft text-warn",
  IN_PROGRESS: "bg-signal-soft text-signal-dark",
  PROOF_SUBMITTED: "bg-warn-soft text-warn",
  BUYER_REVIEW: "bg-warn-soft text-warn",
  REVISION_REQUESTED: "bg-danger-soft text-danger",
  ACCEPTED: "bg-ok-soft text-ok",
  DISPUTED: "bg-danger-soft text-danger",
  REFUNDED: "bg-danger-soft text-danger",
  PAYOUT_RELEASED: "bg-ok-soft text-ok",
  // payment / payout
  REQUIRES_PAYMENT: "bg-warn-soft text-warn",
  AUTHORIZED: "bg-signal-soft text-signal-dark",
  CAPTURED: "bg-ok-soft text-ok",
  PARTIALLY_REFUNDED: "bg-danger-soft text-danger",
  FAILED: "bg-danger-soft text-danger",
  HELD: "bg-warn-soft text-warn",
  RELEASED: "bg-ok-soft text-ok",
  PAID: "bg-ok-soft text-ok",
  CANCELED: "bg-line/60 text-ink-soft",
  OPEN: "bg-danger-soft text-danger",
};

export function StateBadge({ state }: { state: string }) {
  const style = STATE_STYLES[state] ?? "bg-line/60 text-ink-soft";
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${style}`}
    >
      {formatState(state)}
    </span>
  );
}

export function Stamp({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "signal" | "ink" }) {
  const color = tone === "ok" ? "text-ok" : tone === "signal" ? "text-signal" : "text-ink";
  return <span className={`stamp ${color}`}>{children}</span>;
}

export function RiskBadge({ level }: { level: string }) {
  const style =
    level === "HIGH"
      ? "bg-danger-soft text-danger"
      : level === "MEDIUM"
        ? "bg-warn-soft text-warn"
        : "bg-ok-soft text-ok";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold uppercase ${style}`}>
      {level.toLowerCase()} risk
    </span>
  );
}
