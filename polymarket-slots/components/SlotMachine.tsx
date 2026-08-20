"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { describeError, executeSpin, type WalletMode } from "@/lib/client/execute";
import { connect, hasInjectedWallet, shortAddress, type Connection } from "@/lib/client/wallet";
import { CATEGORIES, HORIZONS, MIN_BET_USD } from "@/lib/config";
import { bookGrade, computePoints, type PointsBreakdown } from "@/lib/points";
import { TIER_STYLE, encodeCard } from "@/lib/share";
import type { CategoryKey, HorizonKey, Rules, ScreeningSummary, SpinResult } from "@/lib/types";

type Phase = "idle" | "screening" | "spinning" | "result";
type ExecPhase = "idle" | "signing" | "done" | "error";

const SPIN_MS = 2600;
const STORAGE_KEY = "polymarket-slots:progress";

interface Props {
  fixtureMode: boolean;
  maxBet: number;
  rules: Rules;
}

export default function SlotMachine({ fixtureMode, maxBet, rules }: Props) {
  const [bet, setBet] = useState(10);
  const [horizon, setHorizon] = useState<HorizonKey>("24h");
  const [category, setCategory] = useState<CategoryKey>("any");

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<SpinResult | null>(null);
  const [points, setPoints] = useState<PointsBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screening, setScreening] = useState<ScreeningSummary | null>(null);

  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);

  const [wallet, setWallet] = useState<Connection | null>(null);
  const [mode, setMode] = useState<WalletMode>("eoa");
  const [funder, setFunder] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);

  const [execPhase, setExecPhase] = useState<ExecPhase>("idle");
  const [execMessage, setExecMessage] = useState<string | null>(null);

  const windowRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // Restore the running score. Wrapped because storage throws in some contexts.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { totalPoints?: number; streak?: number };
      if (typeof parsed.totalPoints === "number") setTotalPoints(parsed.totalPoints);
      if (typeof parsed.streak === "number") setStreak(parsed.streak);
    } catch {
      /* no saved progress; not worth surfacing */
    }
  }, []);

  const persist = useCallback((nextTotal: number, nextStreak: number) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ totalPoints: nextTotal, streak: nextStreak }),
      );
    } catch {
      /* storage unavailable; the session still works, it just won't persist */
    }
  }, []);

  /** The reel contents: real qualifying markets, then the winner last. */
  const strip = useMemo(() => {
    if (!result) return [];
    const filler = result.reelFiller.length > 0 ? result.reelFiller : [result.market.question];
    const items: { q: string; sub: string }[] = [];
    // Enough repeats that the reel reads as motion rather than a short list.
    for (let i = 0; i < 14; i++) {
      items.push({ q: filler[i % filler.length], sub: "screened · eligible" });
    }
    items.push({
      q: result.market.question,
      sub: `${result.outcome.label.toUpperCase()} · ${Math.round(result.quote.expectedAvgPrice * 100)}¢`,
    });
    return items;
  }, [result]);

  // Drive the landing animation once a result exists.
  useEffect(() => {
    if (phase !== "spinning" || !result || strip.length === 0) return;

    const stripEl = stripRef.current;
    const windowEl = windowRef.current;
    if (!stripEl || !windowEl) return;

    // Measure a slot, not the window: the window carries a 1px border, so its
    // clientHeight is 2px short of a slot and that error compounds across every
    // row, landing the reel visibly off the payline.
    const firstSlot = stripEl.querySelector<HTMLElement>(".slot");
    const slotHeight = firstSlot?.offsetHeight ?? windowEl.clientHeight;
    const finalOffset = -(strip.length - 1) * slotHeight;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      stripEl.style.transition = "none";
      stripEl.style.transform = `translateY(${finalOffset}px)`;
      setPhase("result");
      return;
    }

    stripEl.style.transition = "none";
    stripEl.style.transform = "translateY(0px)";
    // Force a reflow so the browser doesn't collapse the reset and the move
    // into a single style change, which would skip the animation entirely.
    void stripEl.offsetHeight;

    stripEl.style.transition = `transform ${SPIN_MS}ms cubic-bezier(0.16, 0.84, 0.24, 1)`;
    stripEl.style.transform = `translateY(${finalOffset}px)`;

    const timer = setTimeout(() => setPhase("result"), SPIN_MS + 60);
    return () => clearTimeout(timer);
  }, [phase, result, strip]);

  const pull = useCallback(async () => {
    if (phase === "screening" || phase === "spinning") return;

    setError(null);
    setScreening(null);
    setResult(null);
    setPoints(null);
    setExecPhase("idle");
    setExecMessage(null);
    setPhase("screening");

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ betUsd: bet, horizon, category }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? "Something went wrong.");
        setScreening(data.screening ?? null);
        setPhase("idle");
        // A failed spin breaks the streak.
        setStreak(0);
        persist(totalPoints, 0);
        return;
      }

      const spin: SpinResult = data.spin;
      const nextStreak = streak + 1;
      const breakdown = computePoints({
        betUsd: spin.betUsd,
        impliedProbability: spin.quote.expectedAvgPrice,
        slippageCents: spin.evaluation.fill?.slippageCents ?? 0,
        hoursToResolution: spin.market.hoursToResolution,
        streak,
      });

      const nextTotal = totalPoints + breakdown.total;
      setResult(spin);
      setPoints(breakdown);
      setStreak(nextStreak);
      setTotalPoints(nextTotal);
      persist(nextTotal, nextStreak);
      setPhase("spinning");
    } catch {
      setError("Couldn't reach the machine. Check your connection and try again.");
      setPhase("idle");
    }
  }, [bet, category, horizon, phase, persist, streak, totalPoints]);

  const onConnect = useCallback(async () => {
    setWalletError(null);
    try {
      setWallet(await connect());
    } catch (err) {
      setWalletError(describeError(err));
    }
  }, []);

  const placeBet = useCallback(async () => {
    if (!result) return;
    if (!wallet) {
      await onConnect();
      return;
    }

    setExecPhase("signing");
    setExecMessage(null);
    try {
      const exec = await executeSpin({
        walletClient: wallet.walletClient,
        address: wallet.address,
        spin: result,
        mode,
        funderAddress: funder,
      });
      setExecPhase("done");
      setExecMessage(
        exec.filledShares
          ? `Filled ${exec.filledShares.toFixed(2)} shares.`
          : `Order accepted${exec.status ? ` (${exec.status})` : ""}.`,
      );
    } catch (err) {
      setExecPhase("error");
      setExecMessage(describeError(err));
    }
  }, [funder, mode, onConnect, result, wallet]);

  const shareUrl = useMemo(() => {
    if (!result || !points) return null;
    const encoded = encodeCard({
      q: result.market.question,
      o: result.outcome.label,
      p: result.quote.expectedAvgPrice,
      b: result.betUsd,
      w: result.quote.payoutIfWin,
      pts: points.total,
      t: points.tier,
      g: bookGrade(result.evaluation.score),
      h: result.market.hoursToResolution,
      c: result.market.category,
    });
    return `/card/${encoded}`;
  }, [points, result]);

  const busy = phase === "screening" || phase === "spinning";
  const tier = points ? TIER_STYLE[points.tier] : null;

  return (
    <>
      {fixtureMode && (
        <div className="banner warn">
          <strong>Fixture mode.</strong> Running on bundled sample markets — nothing here is
          live and no order can be placed. Unset <code>FIXTURE_MODE</code> to connect to
          Polymarket.
        </div>
      )}

      <WalletBar
        wallet={wallet}
        mode={mode}
        setMode={setMode}
        funder={funder}
        setFunder={setFunder}
        onConnect={onConnect}
        error={walletError}
        totalPoints={totalPoints}
        streak={streak}
        disabled={fixtureMode}
      />

      <section className="cabinet">
        <div className="tumblers">
          <div className={`tumbler ${busy ? "live" : ""}`}>
            <div className="k">Category</div>
            <div className="v">
              {CATEGORIES[result?.market.category ?? category].emoji}{" "}
              {CATEGORIES[result?.market.category ?? category].label}
            </div>
          </div>
          <div className={`tumbler ${busy ? "live" : ""}`}>
            <div className="k">Settles</div>
            <div className="v">
              {phase === "result" && result
                ? formatHours(result.market.hoursToResolution)
                : HORIZONS[horizon].label}
            </div>
          </div>
          <div className={`tumbler ${busy ? "live" : ""}`}>
            <div className="k">Odds</div>
            <div className="v">
              {phase === "result" && result ? `${result.quote.multiplier.toFixed(2)}x` : "—"}
            </div>
          </div>
        </div>

        <div className={`window ${busy ? "spinning" : ""}`} ref={windowRef}>
          <div className="strip" ref={stripRef}>
            {strip.length === 0 ? (
              <div className="slot">
                <div className="idle-slot">
                  {phase === "screening"
                    ? "Reading order books…"
                    : "Set your bet and pull the lever"}
                </div>
              </div>
            ) : (
              strip.map((item, i) => (
                <div className="slot" key={`${i}-${item.q}`}>
                  <div className="q">{item.q}</div>
                  <div className="sub">{item.sub}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="controls">
          <div className="field">
            <span className="label">Bet</span>
            <div className="bet-row">
              <label className="bet-input">
                <span>$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={MIN_BET_USD}
                  max={maxBet}
                  step="1"
                  value={bet}
                  aria-label="Bet amount in dollars"
                  onChange={(e) => setBet(clampBet(Number(e.target.value), maxBet))}
                  disabled={busy}
                />
              </label>
              {[5, 10, 25, 50].filter((v) => v <= maxBet).map((v) => (
                <button
                  key={v}
                  type="button"
                  className="chip"
                  aria-pressed={bet === v}
                  onClick={() => setBet(v)}
                  disabled={busy}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="label">Settles within</span>
            <div className="chips">
              {(Object.keys(HORIZONS) as HorizonKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className="chip"
                  aria-pressed={horizon === key}
                  onClick={() => setHorizon(key)}
                  disabled={busy}
                >
                  {HORIZONS[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="label">Category</span>
            <div className="chips">
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className="chip"
                  aria-pressed={category === key}
                  onClick={() => setCategory(key)}
                  disabled={busy}
                >
                  {CATEGORIES[key].emoji} {CATEGORIES[key].label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="lever" onClick={pull} disabled={busy}>
            {phase === "screening"
              ? "Screening books…"
              : phase === "spinning"
                ? "Spinning…"
                : "Pull the lever"}
          </button>
        </div>
      </section>

      {error && (
        <div className="banner bad" role="status">
          {error}
        </div>
      )}

      {phase === "result" && result && points && tier && (
        <section className="result">
          <div className="result-head">
            <span
              className="tier-badge"
              style={{ background: tier.glow, color: tier.accent, border: `1px solid ${tier.accent}` }}
            >
              {tier.label}
            </span>
            <span className="points">+{points.total.toLocaleString("en-US")} pts</span>
          </div>

          <div className="grid">
            <Cell k="You'd buy" v={result.outcome.label} />
            <Cell k="At" v={`${(result.quote.expectedAvgPrice * 100).toFixed(1)}¢`} />
            <Cell k="Shares" v={result.quote.expectedShares.toFixed(2)} />
            <Cell k="Pays if right" v={`$${result.quote.payoutIfWin.toFixed(2)}`} good />
            <Cell k="Price cap" v={`${(result.quote.limitPrice * 100).toFixed(0)}¢`} />
            <Cell k="Spread" v={`${(result.evaluation.metrics.spreadCents ?? 0).toFixed(1)}¢`} />
            <Cell
              k="Slippage"
              v={`${(result.evaluation.fill?.slippageCents ?? 0).toFixed(2)}¢`}
            />
            <Cell k="Book" v={bookGrade(result.evaluation.score)} />
          </div>

          {points.notes.length > 0 && (
            <div className="notes">
              {points.notes.map((n) => (
                <span className="note" key={n}>
                  {n}
                </span>
              ))}
            </div>
          )}

          <div className="actions">
            <button
              type="button"
              className="btn primary"
              onClick={placeBet}
              disabled={fixtureMode || execPhase === "signing" || execPhase === "done"}
            >
              {execPhase === "signing"
                ? "Waiting for signature…"
                : execPhase === "done"
                  ? "Bet placed ✓"
                  : wallet
                    ? `Take the bet · $${result.betUsd.toFixed(2)}`
                    : "Connect wallet to take it"}
            </button>
            {shareUrl && (
              <a className="btn" href={shareUrl} target="_blank" rel="noreferrer">
                Share card ↗
              </a>
            )}
            <button type="button" className="btn" onClick={pull} disabled={busy}>
              Spin again
            </button>
          </div>

          {execMessage && (
            <div className={`banner ${execPhase === "error" ? "bad" : ""}`} role="status">
              {execMessage}
            </div>
          )}

          <details className="working">
            <summary>How the machine picked this ({result.screening.eligible} bets qualified)</summary>
            <div className="funnel">
              <FunnelRow label="Markets matching your filters" n={result.screening.fetched} />
              <FunnelRow label="Sides screened (Yes + No)" n={result.screening.booksChecked} />
              <FunnelRow label="Sides that passed" n={result.screening.eligible} />
              {Object.entries(result.screening.rejections)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => (
                  <FunnelRow key={reason} label={`rejected — ${reason}`} n={count} />
                ))}
            </div>
            <div className="rules">
              Every candidate had to clear all of: spread ≤ {rules.maxSpreadCents}¢, no more than{" "}
              {rules.maxSlippageCents}¢ of slippage on your ${result.betUsd.toFixed(0)}, a price
              between {Math.round(rules.minPrice * 100)}¢ and {Math.round(rules.maxPrice * 100)}¢,
              at least ${rules.minVolume24hUsd.toLocaleString("en-US")} of 24h volume, and{" "}
              {rules.minDepthMultiple}× your bet resting near the touch. The pick is then weighted
              toward the healthiest books.
            </div>
          </details>
        </section>
      )}

      {screening && !result && (
        <details className="working" open>
          <summary>Why nothing qualified</summary>
          <div className="funnel">
            <FunnelRow label="Markets matching your filters" n={screening.fetched} />
            <FunnelRow label="Sides screened (Yes + No)" n={screening.booksChecked} />
            {Object.entries(screening.rejections)
              .sort((a, b) => b[1] - a[1])
              .map(([reason, count]) => (
                <FunnelRow key={reason} label={`rejected — ${reason}`} n={count} />
              ))}
          </div>
        </details>
      )}
    </>
  );
}

function Cell({ k, v, good }: { k: string; v: string; good?: boolean }) {
  return (
    <div className="cell">
      <div className="k">{k}</div>
      <div className={`v${good ? " good" : ""}`}>{v}</div>
    </div>
  );
}

function FunnelRow({ label, n }: { label: string; n: number }) {
  return (
    <div className="funnel-row">
      <span>{label}</span>
      <span className="n">{n}</span>
    </div>
  );
}

interface WalletBarProps {
  wallet: Connection | null;
  mode: WalletMode;
  setMode: (m: WalletMode) => void;
  funder: string;
  setFunder: (f: string) => void;
  onConnect: () => void;
  error: string | null;
  totalPoints: number;
  streak: number;
  disabled: boolean;
}

function WalletBar({
  wallet,
  mode,
  setMode,
  funder,
  setFunder,
  onConnect,
  error,
  totalPoints,
  streak,
  disabled,
}: WalletBarProps) {
  const [canConnect, setCanConnect] = useState(false);
  // Checked after mount: the server has no idea whether a wallet is installed,
  // and rendering the answer directly would mismatch on hydration.
  useEffect(() => setCanConnect(hasInjectedWallet()), []);

  return (
    <>
      <div className="wallet-bar">
        {wallet ? (
          <>
            <span className="pill">{shortAddress(wallet.address)}</span>
            <select
              className="mode-select"
              value={mode}
              onChange={(e) => setMode(e.target.value as WalletMode)}
              aria-label="Which wallet holds your USDC"
            >
              <option value="eoa">Funds in this wallet</option>
              <option value="proxy">Funds in my Polymarket wallet</option>
              <option value="safe">Funds in my Polymarket (Safe)</option>
            </select>
            {mode !== "eoa" && (
              <input
                className="funder-input"
                placeholder="0x… your Polymarket wallet address"
                value={funder}
                onChange={(e) => setFunder(e.target.value)}
                aria-label="Polymarket wallet address"
              />
            )}
          </>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={onConnect}
            disabled={disabled || !canConnect}
          >
            {canConnect ? "Connect wallet" : "No browser wallet detected"}
          </button>
        )}

        <div style={{ flex: 1 }} />

        <div className="scoreboard">
          <span>
            <b>{totalPoints.toLocaleString("en-US")}</b> pts
          </span>
          <span>streak {streak}</span>
        </div>
      </div>

      {error && (
        <div className="banner bad" role="status">
          {error}
        </div>
      )}
    </>
  );
}

function clampBet(value: number, max: number): number {
  if (!Number.isFinite(value)) return MIN_BET_USD;
  return Math.min(Math.max(value, MIN_BET_USD), max);
}

function formatHours(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
