"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { describeError, executeSpin, type WalletMode } from "@/lib/client/execute";
import { connect, hasInjectedWallet, shortAddress, type Connection } from "@/lib/client/wallet";
import {
  HORIZONS,
  LEVEL_OPTIONS,
  MIN_BET_USD,
  RECOMMENDED_LEVELS,
  RECOMMENDED_SPREAD_CENTS,
  SPREAD_OPTIONS,
} from "@/lib/config";
import { bookGrade, computePoints, type PointsBreakdown } from "@/lib/points";
import { encodeCard, encodeHistory } from "@/lib/share";
import type { CategoryKey, HorizonKey, Rules, ScreeningSummary, SpinResult } from "@/lib/types";

import {
  MARKET_IDS,
  MARKET_IMAGES,
  MEME_CAPTIONS,
  MEME_IDS,
  MEME_IMAGES,
  type MarketId,
  type MemeId,
} from "@/lib/reels";

import { CategoryMark } from "./CategoryMark";
import { surgeField } from "./ProbabilityField";
import { MarketMark, MemeMark } from "./ReelSymbols";
import { Sparkline } from "./Sparkline";

type Phase = "idle" | "screening" | "spinning" | "result";
type ExecPhase = "idle" | "signing" | "done" | "error";

/** Reels land one at a time — the gap between them is the anticipation. */
const REEL_MS = [1500, 2150, 2800];
const BULB_COUNT = 13;
const STORAGE_KEY = "polyslots:cabinet";

const CAT_LABEL: Record<CategoryKey, string> = {
  any: "Wildcard",
  geopolitics: "World",
  sports: "Sports",
  crypto: "Crypto",
  politics: "Politics",
  culture: "Culture",
  economics: "Econ",
};

const CATEGORY_ORDER: CategoryKey[] = [
  "any", "geopolitics", "sports", "crypto", "politics", "culture", "economics",
];

const SPIN_PRICES = [12, 23, 31, 38, 44, 49, 53, 58, 63, 67, 72, 81, 88];

type Cell =
  | { kind: "icon"; cat: CategoryKey; cap: string }
  | { kind: "meme"; id: MemeId; cap: string }
  | { kind: "image"; src: string; cap: string }
  | { kind: "market"; id: MarketId; text: string; cap: string }
  | { kind: "text"; text: string; cap: string; tone?: "yes" | "no" };

/** The resting face, shown before the first pull and after a refusal. */
const IDLE_FACE: Cell[][] = [
  [{ kind: "meme", id: "turtleneck", cap: MEME_CAPTIONS.turtleneck }],
  [{ kind: "text", text: "?", cap: "side" }],
  [{ kind: "market", id: "odds", text: "––¢", cap: "price" }],
];

interface Props {
  fixtureMode: boolean;
  maxBet: number;
  rules: Rules;
}

export default function SlotMachine({ fixtureMode, maxBet, rules }: Props) {
  const [bet, setBet] = useState(10);
  const [horizon, setHorizon] = useState<HorizonKey>("24h");
  const [category, setCategory] = useState<CategoryKey>("any");
  const [maxSpread, setMaxSpread] = useState(RECOMMENDED_SPREAD_CENTS);
  const [maxLevels, setMaxLevels] = useState(RECOMMENDED_LEVELS);

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<SpinResult | null>(null);
  const [points, setPoints] = useState<PointsBreakdown | null>(null);
  const [miss, setMiss] = useState<{ message: string; screening: ScreeningSummary | null } | null>(null);
  // The server validates and clamps the dials, so echo back what it actually
  // used rather than assuming our request was honoured verbatim.
  const [appliedRules, setAppliedRules] = useState<Rules>(rules);

  const [credits, setCredits] = useState(0);
  const [shownCredits, setShownCredits] = useState(0);
  const [streak, setStreak] = useState(0);

  // Fixed, not random: a random initial face renders differently on the server
  // and the client and fails hydration. A cabinet at rest shows one face anyway.
  const [strips, setStrips] = useState<Cell[][]>(() => IDLE_FACE);
  const [spinToken, setSpinToken] = useState(0);
  const pending = useRef<{ result: SpinResult; points: PointsBreakdown } | null>(null);

  const [wallet, setWallet] = useState<Connection | null>(null);
  const [mode, setMode] = useState<WalletMode>("eoa");
  const [funder, setFunder] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [canConnect, setCanConnect] = useState(false);

  const [execPhase, setExecPhase] = useState<ExecPhase>("idle");
  const [execMessage, setExecMessage] = useState<string | null>(null);

  const stripRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const [bulbPos, setBulbPos] = useState(0);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => setCanConnect(hasInjectedWallet()), []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (typeof saved?.credits === "number") { setCredits(saved.credits); setShownCredits(saved.credits); }
      if (typeof saved?.streak === "number") setStreak(saved.streak);
    } catch {
      /* storage unavailable; the session still plays, it just won't persist */
    }
  }, []);

  const persist = useCallback((c: number, s: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ credits: c, streak: s }));
    } catch {
      /* ignore */
    }
  }, []);

  const busy = phase === "screening" || phase === "spinning";

  // Marquee chase. Faster while the reels are running, flashing on a big win.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const speed = flashing ? 110 : busy ? 90 : 240;
    const id = setInterval(() => setBulbPos((p) => p + 1), speed);
    return () => clearInterval(id);
  }, [busy, flashing]);

  // Roll the credits meter up rather than snapping it.
  useEffect(() => {
    if (shownCredits === credits) return;
    if (prefersReducedMotion()) { setShownCredits(credits); return; }
    const from = shownCredits;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 650);
      const eased = 1 - (1 - t) ** 3;
      setShownCredits(Math.round(from + (credits - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // Intentionally keyed only on the target: re-running on every tick would
    // restart the animation each frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credits]);

  // Drive the reels once new strips have rendered.
  useEffect(() => {
    if (spinToken === 0 || !pending.current) return;
    let cancelled = false;

    (async () => {
      const reduced = prefersReducedMotion();
      for (let i = 0; i < 3; i++) {
        const el = stripRefs[i].current;
        if (!el) continue;
        const cell = el.querySelector<HTMLElement>(".rcell");
        const cellH = cell?.offsetHeight ?? 132;
        const target = -(strips[i].length - 1) * cellH;

        if (reduced) {
          el.style.transition = "none";
          el.style.transform = `translateY(${target}px)`;
          continue;
        }
        el.style.transition = "none";
        el.style.transform = "translateY(0px)";
        // Force a reflow so the reset and the move aren't collapsed into one.
        void el.offsetHeight;
        el.style.transition = `transform ${REEL_MS[i]}ms cubic-bezier(0.13, 0.78, 0.2, 1)`;
        el.style.transform = `translateY(${target}px)`;
      }

      if (!reduced) await wait(REEL_MS[REEL_MS.length - 1] + 40);
      if (cancelled) return;

      const held = pending.current;
      if (!held) return;
      setResult(held.result);
      setPoints(held.points);
      setPhase("result");
      setCredits((c) => {
        const next = c + held.points.total;
        persist(next, streak + 1);
        return next;
      });
      setStreak((s) => s + 1);

      // The background answers the machine: a longer shot moves it more, so the
      // ambience is loudest exactly when the pull is worth filming.
      const odds = held.result.quote.multiplier;
      surgeField(Math.min(1, 0.25 + (odds - 1) / 6));

      if (held.points.tier === "epic" || held.points.tier === "legendary") {
        setFlashing(true);
        setTimeout(() => setFlashing(false), 900);
      }
      pending.current = null;
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken]);

  const pull = useCallback(async () => {
    if (busy) return;
    setResult(null);
    setPoints(null);
    setMiss(null);
    setExecPhase("idle");
    setExecMessage(null);
    setPhase("screening");

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          betUsd: bet,
          horizon,
          category,
          maxSpreadCents: maxSpread,
          maxLevelsCrossed: maxLevels,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        setMiss({ message: data.error ?? "Something went wrong.", screening: data.screening ?? null });
        setPhase("idle");
        setStreak(0);
        persist(credits, 0);
        setStrips(IDLE_FACE);
        for (const r of stripRefs) if (r.current) r.current.style.transform = "translateY(0px)";
        return;
      }

      const spin: SpinResult = data.spin;
      if (data.rules) setAppliedRules(data.rules as Rules);
      const breakdown = computePoints({
        betUsd: spin.betUsd,
        impliedProbability: spin.quote.expectedAvgPrice,
        slippageCents: spin.evaluation.fill?.slippageCents ?? 0,
        hoursToResolution: spin.market.hoursToResolution,
        streak,
      });

      const side = spin.outcome.label.toUpperCase();
      const cents = Math.round(spin.quote.expectedAvgPrice * 100);

      setStrips([
        [...fillCells(0, 16), memeCell()],
        [...fillCells(1, 16), { kind: "text", text: side, cap: "side", tone: side === "YES" ? "yes" : "no" }],
        [...fillCells(2, 16), marketCell(`${cents}¢`)],
      ]);

      pending.current = { result: spin, points: breakdown };
      setPhase("spinning");
      setSpinToken((t) => t + 1);
    } catch {
      setMiss({ message: "Couldn't reach the machine. Check your connection and pull again.", screening: null });
      setPhase("idle");
    }
  }, [bet, busy, category, credits, horizon, maxLevels, maxSpread, persist, streak]);

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
    if (!wallet) { await onConnect(); return; }

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

  const shareHref =
    result && points
      ? `/card/${encodeCard({
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
          s: encodeHistory(result.history),
        })}`
      : null;

  return (
    <main className="room">
      {fixtureMode && (
        <p className="preamble">
          <b>SAMPLE-DATA MODE.</b> Running on bundled markets, not live Polymarket — no order
          can be placed. Unset <code>FIXTURE_MODE</code> to connect to the real exchange.
        </p>
      )}

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
                placeholder="0x… Polymarket wallet address"
                value={funder}
                onChange={(e) => setFunder(e.target.value)}
                aria-label="Polymarket wallet address"
              />
            )}
          </>
        ) : (
          <button
            type="button"
            className="ghost"
            onClick={onConnect}
            disabled={fixtureMode || !canConnect}
          >
            {canConnect ? "Connect wallet" : "No browser wallet detected"}
          </button>
        )}
      </div>

      {walletError && <p className="notice bad">{walletError}</p>}

      <section className="machine">
        <header className="marquee">
          <div className="bulbs">
            {Array.from({ length: BULB_COUNT }, (_, i) => (
              <div
                key={i}
                className={`bulb${flashing ? (bulbPos % 2 === 0 ? " on" : "") : (i + bulbPos) % 3 === 0 ? " on" : ""}`}
              />
            ))}
          </div>
          <h1>POLYSLOTS</h1>
          <p>real markets · screened books</p>
        </header>

        <div className="reels">
          {[0, 1, 2].map((i) => (
            <div className="reel" key={i}>
              <div className="rstrip" ref={stripRefs[i]}>
                {strips[i].map((cell, n) => (
                  <ReelCell cell={cell} key={n} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="belly">
          {phase === "result" && result ? (
            <>
              <div className="eyebrow">The machine picked</div>
              <p className="question">{result.market.question}</p>
              <div className="meta">
                <b>{CAT_LABEL[result.market.category]}</b> · settles in{" "}
                <b>{formatHours(result.market.hoursToResolution)}</b> · book{" "}
                <b>{bookGrade(result.evaluation.score)}</b> ·{" "}
                <b>{result.quote.multiplier.toFixed(2)}×</b>
              </div>
            </>
          ) : (
            <div className="idle">
              {phase === "screening"
                ? "READING ORDER BOOKS…"
                : phase === "spinning"
                  ? "…"
                  : miss
                    ? "NO BET CLEARED THE SCREEN"
                    : "SET YOUR STAKE · PULL THE HANDLE"}
            </div>
          )}
        </div>

        <div className="console">
          <div className="credits">
            <span className="k">CREDITS</span>
            <span className="v">{shownCredits.toLocaleString("en-US")}</span>
          </div>

          <div>
            <span className="lab">Stake</span>
            <div className="row">
              <label className="stake">
                <span>$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={MIN_BET_USD}
                  max={maxBet}
                  step="1"
                  value={bet}
                  disabled={busy}
                  aria-label="Stake in dollars"
                  onChange={(e) => setBet(clampBet(Number(e.target.value), maxBet))}
                />
              </label>
              {[5, 10, 25, 50].filter((v) => v <= maxBet).map((v) => (
                <button
                  key={v}
                  type="button"
                  className="key"
                  aria-pressed={bet === v}
                  disabled={busy}
                  onClick={() => setBet(v)}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="lab">Settles within</span>
            <div className="row">
              {(Object.keys(HORIZONS) as HorizonKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className="key"
                  aria-pressed={horizon === k}
                  disabled={busy}
                  onClick={() => setHorizon(k)}
                >
                  {HORIZONS[k].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="lab">Category</span>
            <div className="row scroll">
              {CATEGORY_ORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  className="key"
                  aria-pressed={category === k}
                  disabled={busy}
                  onClick={() => setCategory(k)}
                >
                  {CAT_LABEL[k]}
                </button>
              ))}
            </div>
          </div>

          <details className="tuning">
            <summary>
              Book quality — spread ≤ {maxSpread}¢, fills within{" "}
              {maxLevels === 1 ? "one price" : `${maxLevels} prices`}
            </summary>

            <div className="tuning-body">
              <span className="lab">Widest spread you'll accept</span>
              <div className="row">
                {SPREAD_OPTIONS.map((o) => (
                  <button
                    key={o.cents}
                    type="button"
                    className="key"
                    aria-pressed={maxSpread === o.cents}
                    disabled={busy}
                    onClick={() => setMaxSpread(o.cents)}
                  >
                    {o.label}
                    {o.cents === RECOMMENDED_SPREAD_CENTS ? " ★" : ""}
                  </button>
                ))}
              </div>
              <p className="why">{SPREAD_OPTIONS.find((o) => o.cents === maxSpread)?.note}</p>

              <span className="lab">How far into the book your order may eat</span>
              <div className="row">
                {LEVEL_OPTIONS.map((o) => (
                  <button
                    key={o.levels}
                    type="button"
                    className="key"
                    aria-pressed={maxLevels === o.levels}
                    disabled={busy}
                    onClick={() => setMaxLevels(o.levels)}
                  >
                    {o.label}
                    {o.levels === RECOMMENDED_LEVELS ? " ★" : ""}
                  </button>
                ))}
              </div>
              <p className="why">{LEVEL_OPTIONS.find((o) => o.levels === maxLevels)?.note}</p>

              <p className="why muted">
                ★ recommended. Both rules are enforced on the server — the machine will refuse
                to land on a market that fails them rather than show you a worse fill.
              </p>
            </div>
          </details>

          <button type="button" className="handle" onClick={pull} disabled={busy}>
            {phase === "screening" ? "SCREENING" : phase === "spinning" ? "SPINNING" : "PULL"}
          </button>
        </div>
      </section>

      {miss && (
        <>
          <p className="notice bad">{miss.message}</p>
          {miss.screening && (
            <details className="working" open>
              <summary>What it refused, and why</summary>
              <Funnel screening={miss.screening} />
            </details>
          )}
        </>
      )}

      {phase === "result" && result && points && (
        <>
          <Ticket result={result} points={points} />

          <div className="after">
            <button
              type="button"
              className="ghost primary"
              onClick={placeBet}
              disabled={fixtureMode || execPhase === "signing" || execPhase === "done"}
            >
              {execPhase === "signing"
                ? "Waiting for signature…"
                : execPhase === "done"
                  ? "Bet placed ✓"
                  : wallet
                    ? `Take it · $${result.betUsd.toFixed(2)}`
                    : "Connect wallet to take it"}
            </button>
            <button type="button" className="ghost" onClick={pull} disabled={busy}>
              Pull again
            </button>
            {shareHref && (
              <a className="ghost" href={shareHref} target="_blank" rel="noreferrer" style={{ textAlign: "center", textDecoration: "none" }}>
                Share ticket ↗
              </a>
            )}
          </div>

          {execMessage && (
            <p className={`notice ${execPhase === "error" ? "bad" : "good"}`} role="status">
              {execMessage}
            </p>
          )}

          {execPhase === "done" && (
            <p className="custody">
              <b>The shares are yours, not ours.</b> They settled straight into your own
              Polymarket account — this app never holds them and cannot touch them. When the
              market resolves, winning shares pay $1.00 each and you redeem them at{" "}
              <a href="https://polymarket.com/portfolio" target="_blank" rel="noreferrer">
                polymarket.com/portfolio
              </a>
              . You can also sell before resolution there at any time.
            </p>
          )}

          <details className="working">
            <summary>
              How it landed here — {result.screening.eligible} of {result.screening.booksChecked} bets passed
            </summary>
            <Funnel screening={result.screening} />
            <div className="rules">
              Every candidate cleared: spread ≤ {appliedRules.maxSpreadCents}¢ · at most{" "}
              {appliedRules.maxLevelsCrossed === 1
                ? "one price level"
                : `${appliedRules.maxLevelsCrossed} price levels`}{" "}
              crossed · slippage ≤ {appliedRules.maxSlippageCents}¢ on your $
              {result.betUsd.toFixed(0)} · price {Math.round(appliedRules.minPrice * 100)}–
              {Math.round(appliedRules.maxPrice * 100)}¢ · $
              {appliedRules.minVolume24hUsd.toLocaleString("en-US")}+ daily volume ·{" "}
              {appliedRules.minDepthMultiple}× your stake resting near the touch. The pick is
              weighted toward the healthiest books.
            </div>
          </details>
        </>
      )}
    </main>
  );
}

function ReelCell({ cell }: { cell: Cell }) {
  if (cell.kind === "icon") {
    return (
      <div className="rcell">
        <CategoryMark category={cell.cat} />
        <div className="cap">{cell.cap}</div>
      </div>
    );
  }
  if (cell.kind === "meme") {
    return (
      <div className="rcell">
        <MemeMark id={cell.id} />
        <div className="cap">{cell.cap}</div>
      </div>
    );
  }
  if (cell.kind === "image") {
    return (
      <div className="rcell">
        {/* Supplied by whoever deployed this; decorative, so no alt text. */}
        <img className="rmeme" src={cell.src} alt="" />
        {cell.cap && <div className="cap">{cell.cap}</div>}
      </div>
    );
  }
  if (cell.kind === "market") {
    return (
      <div className="rcell stacked">
        <MarketMark id={cell.id} />
        <div className="big">{cell.text}</div>
        <div className="cap">{cell.cap}</div>
      </div>
    );
  }
  return (
    <div className={`rcell${cell.tone ? ` ${cell.tone}` : ""}`}>
      <div className="big">{cell.text}</div>
      <div className="cap">{cell.cap}</div>
    </div>
  );
}

function Ticket({ result, points }: { result: SpinResult; points: PointsBreakdown }) {
  const side = result.outcome.label.toUpperCase();
  const isYes = side === "YES";
  const q = result.quote;

  return (
    <article className="ticket">
      <div className="t-head">
        <span>Polyslots</span>
        <span>No. {result.id.slice(0, 4).toUpperCase()}</span>
      </div>

      <h2 className="t-q">{result.market.question}</h2>

      <div className="t-pick">
        <span className={`t-side ${isYes ? "yes" : "no"}`}>{side}</span>
        <span className="t-price">
          at {Math.round(q.expectedAvgPrice * 100)}¢ · {q.multiplier.toFixed(2)}× your money
        </span>
      </div>

      <Sparkline values={result.history} tone={isYes ? "yes" : "no"} />

      <div className="t-rows">
        <Row k="Stake" v={`$${result.betUsd.toFixed(2)}`} />
        <Row k="Returns if right" v={`$${q.payoutIfWin.toFixed(2)}`} win />
        <Row k="Settles in" v={formatHoursLong(result.market.hoursToResolution)} />
        <Row
          k="Spread / slippage"
          v={`${(result.evaluation.metrics.spreadCents ?? 0).toFixed(1)}¢ / ${(result.evaluation.fill?.slippageCents ?? 0).toFixed(2)}¢`}
        />
        <Row
          k="Prices crossed"
          v={crossedLabel(result.evaluation.fill?.levelsConsumed ?? 0)}
        />
        <Row k="Book grade" v={bookGrade(result.evaluation.score)} />
      </div>

      {points.notes.length > 0 && (
        <div className="t-notes">
          {points.notes.map((n) => (
            <span className="t-note" key={n}>{n}</span>
          ))}
        </div>
      )}

      <div className="perf" />

      <div className="t-stub">
        <div className="t-points">
          POINTS
          <b>{points.total.toLocaleString("en-US")}</b>
        </div>
        <div className="stamp" style={{ color: STAMP_COLOR[points.tier] }}>
          {points.tier}
        </div>
      </div>
    </article>
  );
}

const STAMP_COLOR: Record<string, string> = {
  common: "#6B5B48",
  rare: "#1B5E8F",
  epic: "#6B3FA0",
  legendary: "#A8781A",
};

function Row({ k, v, win }: { k: string; v: string; win?: boolean }) {
  return (
    <div className="t-row">
      <span className="k">{k}</span>
      <span className={`v${win ? " win" : ""}`}>{v}</span>
    </div>
  );
}

function Funnel({ screening }: { screening: ScreeningSummary }) {
  return (
    <div className="funnel">
      <FunnelRow label="Markets in your filters" n={screening.fetched} />
      <FunnelRow label="Sides screened (Yes + No)" n={screening.booksChecked} />
      <FunnelRow label="Sides that passed" n={screening.eligible} />
      {Object.entries(screening.rejections)
        .sort((a, b) => b[1] - a[1])
        .map(([reason, count]) => (
          <FunnelRow key={reason} label={`refused — ${reason}`} n={count} />
        ))}
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

/* --- helpers -------------------------------------------------------------- */

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** The left reel's artwork: a drop-in image if you supplied any, else drawn. */
function memeCell(): Cell {
  if (MEME_IMAGES.length > 0) return { kind: "image", src: pick(MEME_IMAGES), cap: "" };
  const id = pick(MEME_IDS);
  return { kind: "meme", id, cap: MEME_CAPTIONS[id] };
}

function randomCell(which: number): Cell {
  if (which === 0) return memeCell();
  if (which === 1) {
    const yes = Math.random() < 0.5;
    return { kind: "text", text: yes ? "YES" : "NO", cap: "side", tone: yes ? "yes" : "no" };
  }
  return marketCell(`${pick(SPIN_PRICES)}¢`);
}

/** The right reel: a supplied image if you added any, else a drawn mark. */
function marketCell(text: string): Cell {
  if (MARKET_IMAGES.length > 0) return { kind: "image", src: pick(MARKET_IMAGES), cap: text };
  return { kind: "market", id: pick(MARKET_IDS), text, cap: "price" };
}

function fillCells(which: number, n: number): Cell[] {
  return Array.from({ length: n }, () => randomCell(which));
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function clampBet(value: number, max: number): number {
  if (!Number.isFinite(value)) return MIN_BET_USD;
  return Math.min(Math.max(Math.round(value), MIN_BET_USD), max);
}

function crossedLabel(levels: number): string {
  if (levels <= 1) return "1 — all at best ask";
  return `${levels} price levels`;
}

function formatHours(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function formatHoursLong(hours: number): string {
  if (hours < 48) return `${Math.round(hours)} hours`;
  return `${Math.round(hours / 24)} days`;
}
