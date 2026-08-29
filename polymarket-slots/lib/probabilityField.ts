/**
 * The ambient probability field.
 *
 * A slow drift of price traces behind the cabinet — the shape a prediction
 * market actually makes: mostly quiet wandering, punctuated by a sharp jump
 * when news lands. It's the most recognisable image in this world, so it earns
 * the background rather than decorating it.
 *
 * Deliberately quiet: low alpha, slow scroll, nothing that competes with the
 * machine. It brightens for a moment when a pull lands a longshot, which is the
 * one time the ambience should be noticed.
 *
 * Framework-agnostic on purpose — the React app and the standalone preview both
 * mount the same code.
 */

export interface FieldOptions {
  /** Number of price traces. */
  traces?: number;
  /** Points rendered across the width. */
  columns?: number;
  /** Columns advanced per second. Low is the point. */
  speed?: number;
}

export interface FieldHandle {
  /** Brighten and kick the traces upward. Strength roughly 0–1. */
  surge(strength?: number): void;
  destroy(): void;
}

interface Trace {
  values: number[];
  /** Long-run level this trace wanders around. */
  anchor: number;
  volatility: number;
  colour: string;
  width: number;
  /** Extra brightness, decays after a surge. */
  glow: number;
}

const DEFAULTS: Required<FieldOptions> = { traces: 7, columns: 84, speed: 0.55 };

/** Read a CSS custom property so the field stays in step with the palette. */
function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** #rrggbb -> "r, g, b", so alpha can be varied per draw. */
function rgbOf(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "201, 162, 39";
  const n = Number.parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export function mountProbabilityField(
  canvas: HTMLCanvasElement,
  options: FieldOptions = {},
): FieldHandle {
  const opts = { ...DEFAULTS, ...options };
  const ctx = canvas.getContext("2d");
  if (!ctx) return { surge: () => {}, destroy: () => {} };

  const brass = rgbOf(cssVar("--brass", "#C9A227"));
  const yes = rgbOf(cssVar("--yes", "#1B7F52"));
  const no = rgbOf(cssVar("--no", "#B8332A"));

  const reduced =
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const traces: Trace[] = [];
  for (let i = 0; i < opts.traces; i++) {
    // Two traces take the market colours; the rest stay brass so the field
    // reads as one texture rather than a pile of competing lines.
    const colour = i === 1 ? yes : i === 4 ? no : brass;
    // Spread the traces across the band so they read as separate markets
    // rather than one thick smudge through the middle.
    const anchor = 0.13 + (i / (opts.traces - 1)) * 0.74 + (Math.random() - 0.5) * 0.06;
    const volatility = 0.016 + Math.random() * 0.022;
    const values: number[] = [];
    let v = anchor;
    for (let c = 0; c < opts.columns + 2; c++) {
      v = step(v, anchor, volatility);
      values.push(v);
    }
    traces.push({
      values,
      anchor,
      volatility,
      colour,
      width: i === 2 ? 1.9 : 1.25,
      glow: 0,
    });
  }

  /** One tick of a mean-reverting walk, with the occasional news jump. */
  function step(v: number, anchor: number, volatility: number): number {
    // Weak reversion: strong pull flattened every trace onto its anchor.
    const reversion = (anchor - v) * 0.007;
    let next = v + reversion + (Math.random() - 0.5) * volatility * 2;
    // News. The step changes are what make this read as a market rather than
    // as noise, so they're worth having often enough to actually see one.
    if (Math.random() < 0.014) next += (Math.random() - 0.45) * 0.3;
    return Math.min(0.97, Math.max(0.03, next));
  }

  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(phase: number) {
    const c = ctx!;
    c.clearRect(0, 0, width, height);
    if (width === 0 || height === 0) return;

    // Keep the traces off the very top and bottom edges.
    const pad = height * 0.07;
    const plot = height - pad * 2;
    const colW = width / (opts.columns - 1);
    const y = (v: number) => pad + (1 - v) * plot;

    // Faint gridlines at the quartiles; the midline a touch brighter, since
    // 50% is the only level that means anything on its own.
    c.lineWidth = 1;
    for (const level of [0.25, 0.5, 0.75]) {
      c.strokeStyle = `rgba(${brass}, ${level === 0.5 ? 0.07 : 0.035})`;
      c.beginPath();
      c.moveTo(0, y(level));
      c.lineTo(width, y(level));
      c.stroke();
    }

    for (const t of traces) {
      const points: [number, number][] = t.values.map((v, i) => [(i - phase) * colW, y(v)]);

      // A whisper of fill under each line gives the field depth without
      // turning it into a solid block of colour.
      const grad = c.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, `rgba(${t.colour}, ${0.07 + t.glow * 0.1})`);
      grad.addColorStop(1, `rgba(${t.colour}, 0)`);
      c.fillStyle = grad;
      c.beginPath();
      c.moveTo(points[0][0], height);
      for (const [px, py] of points) c.lineTo(px, py);
      c.lineTo(points[points.length - 1][0], height);
      c.closePath();
      c.fill();

      c.strokeStyle = `rgba(${t.colour}, ${0.34 + t.glow * 0.45})`;
      c.lineWidth = t.width + t.glow * 0.9;
      c.lineJoin = "round";
      c.lineCap = "round";
      c.shadowColor = `rgba(${t.colour}, ${0.25 + t.glow * 0.45})`;
      c.shadowBlur = 10 + t.glow * 18;
      c.beginPath();
      points.forEach(([px, py], i) => (i === 0 ? c.moveTo(px, py) : c.lineTo(px, py)));
      c.stroke();

      // The live price: a lit dot at "now", on the right-hand edge.
      const head = points[opts.columns - 1];
      if (head) {
        c.fillStyle = `rgba(${t.colour}, ${0.75 + t.glow * 0.25})`;
        c.beginPath();
        c.arc(head[0], head[1], 2.1 + t.glow * 1.6, 0, Math.PI * 2);
        c.fill();
      }
      c.shadowBlur = 0;
    }
  }

  let phase = 0;
  let raf = 0;
  let last = performance.now();
  let running = true;

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    phase += dt * opts.speed;
    while (phase >= 1) {
      phase -= 1;
      for (const t of traces) {
        t.values.shift();
        t.values.push(step(t.values[t.values.length - 1], t.anchor, t.volatility));
      }
    }
    for (const t of traces) t.glow = Math.max(0, t.glow - dt * 0.85);

    draw(phase);
    if (running) raf = requestAnimationFrame(frame);
  }

  const onResize = () => {
    resize();
    draw(phase);
  };

  // A background animation has no business running on a tab nobody's looking at.
  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!reduced && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  resize();
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibility);

  if (reduced) {
    // Still worth having, just not moving.
    running = false;
    draw(0);
  } else {
    raf = requestAnimationFrame(frame);
  }

  return {
    surge(strength = 1) {
      if (reduced) return;
      for (const t of traces) {
        t.glow = Math.min(1.6, t.glow + strength);
        // Kick the tail upward so the jump is visible, not just brighter.
        const kick = strength * (0.12 + Math.random() * 0.14);
        for (let i = t.values.length - 8; i < t.values.length; i++) {
          if (i < 0) continue;
          const ramp = (i - (t.values.length - 8)) / 8;
          t.values[i] = Math.min(0.97, t.values[i] + kick * ramp);
        }
      }
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
