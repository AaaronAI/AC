# 12 · Design System — "Signal"

Owner: Design. Implemented by `/app` with Tailwind CSS (D-011). Brand rationale in
`11-brand-strategy.md`. Copy in component examples follows the honesty rules (D-020)
— demo content is always labeled demo.

---

## 1. Principles

1. **High-contrast editorial.** Near-black ink on warm white; the page reads like a
   sharp magazine, not a SaaS dashboard.
2. **Oversized type.** Headlines carry the design; decoration doesn't.
3. **Neutral foundation + one vivid signal color.** Everything is neutral except the
   things that matter: prices, CTAs, status stamps.
4. **Real photography.** Actual sellers, actual venues, actual proof shots. No stock
   imagery, no illustration-as-filler. Until real photos exist, use labeled
   placeholder frames — never fake "lifestyle" imagery (D-020).
5. **Stamps over badges-soup.** Verified / Booked / Completed rendered like editorial
   rubber stamps — few, meaningful, earned.
6. **Minimal clutter.** One primary action per view. If a section can't say why it's
   on screen, it's cut.
7. **Visible pricing.** Price appears on every listing card, detail page, and receipt
   in full-size type. Fees itemized, never buried (D-005).

## 2. Design tokens — color

### Signal (brand accent) — vivid orange-red, base `#FF4D00`

| Token | Hex | Use |
|---|---|---|
| `signal-50` | `#FFF3ED` | Tinted backgrounds, hover washes |
| `signal-100` | `#FFE3D5` | Selected-state fills |
| `signal-200` | `#FFC4A8` | Decorative accents |
| `signal-300` | `#FF9C6E` | Charts, illustration accents |
| `signal-400` | `#FF7333` | Hover on signal elements |
| `signal-500` | `#FF4D00` | **Base.** CTAs, price highlights, stamps, focus ring |
| `signal-600` | `#DB3F00` | Active/pressed |
| `signal-700` | `#B23300` | **Signal-colored text on light backgrounds** |
| `signal-800` | `#8A2800` | Deep accents |
| `signal-900` | `#661D00` | Signal-on-signal contrast pairings |

**Contrast rules (WCAG-driven, see §10):** `signal-500` on white measures ≈ 3.3:1 —
legal for large text (≥ 24px / 19px bold) and UI components only. Body-size signal
text on light uses `signal-700` (≈ 6.2:1). Text **on** a `signal-500` fill is always
`ink-900` (≈ 5.2:1), never white — the black-on-orange pairing is the brand's
signature button.

### Ink (neutrals) — warm dark-ink scale

| Token | Hex | Use |
|---|---|---|
| `ink-900` | `#16130F` | Primary text, primary buttons |
| `ink-700` | `#3C362E` | Headings-secondary, icons |
| `ink-500` | `#6B6357` | Secondary text (≈ 5.6:1 on paper-0) |
| `ink-400` | `#8A8175` | Placeholder text, disabled labels (large/UI only) |
| `ink-300` | `#B5AC9F` | Borders-strong, dividers on tint |
| `ink-200` | `#D8D2C8` | Default borders |
| `ink-100` | `#EDE9E2` | Hairlines, table rules, wells |
| `paper-50` | `#F7F5F0` | Section alternation, cards-on-page |
| `paper-0` | `#FDFCFA` | Page background (warm white, not pure `#FFF`) |

### Status colors

| Token | Hex | Use | Text pairing on light |
|---|---|---|---|
| `success-600` | `#0F7B3F` | Accepted, payout released, approved | `success-700` `#0A5E30` |
| `warning-600` | `#996A00` | Pending approvals, holds, SLA warnings | `warning-700` `#7A5500` |
| `danger-600` | `#C4231B` | Disputes, rejections, destructive actions | `danger-700` `#9C1C15` |
| `info-600` | `#1D5FA8` | Neutral informational states | `info-700` `#174C87` |

Status colors are never used decoratively; they only encode state, always paired with
a text label (never color alone, §10).

## 3. Typography

No self-hosted fonts in MVP; system stack first, licensed upgrade path second.

```css
--font-display: "Archivo", "Inter", ui-sans-serif, system-ui, -apple-system,
  "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;   /* headings */
--font-body: "Inter", ui-sans-serif, system-ui, -apple-system,
  "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;   /* everything else */
--font-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace; /* money, IDs, timestamps */
```

Upgrade path: load **Archivo** (headings — strong grotesque, editorial) and **Inter**
(UI/body) via Google Fonts when performance budget allows; the system stack is the
permanent fallback. Money amounts, campaign IDs, and timestamps render in
`--font-mono` with `font-variant-numeric: tabular-nums`.

Type scale (rem, 1rem = 16px; desktop / mobile):

| Token | Size | Weight | Line-height | Use |
|---|---|---|---|---|
| `display-1` | 4.5 / 2.75rem | 800, tight tracking (−0.02em) | 1.05 | Hero H1 |
| `display-2` | 3 / 2.25rem | 800 | 1.1 | Page titles |
| `h1` | 2.25 / 1.75rem | 700 | 1.15 | Section heads |
| `h2` | 1.5 / 1.375rem | 700 | 1.2 | Card titles, subsections |
| `h3` | 1.125rem | 600 | 1.3 | Widget heads |
| `body` | 1rem | 400 | 1.55 | Default |
| `body-sm` | 0.875rem | 400 | 1.5 | Secondary, table cells |
| `caption` | 0.75rem | 500, +0.04em, uppercase optional | 1.4 | Labels, stamps, chips |
| `price-lg` | 1.75rem | 700 mono | 1.1 | Card/detail prices |

## 4. Spacing, radii, borders, shadows

- **Spacing:** 4px base scale — `1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40,
  12=48, 16=64, 20=80, 24=96`. Section vertical rhythm: 64px mobile / 96px desktop.
- **Radii:** editorial = mostly sharp. `r-0 0` (imagery, hero blocks), `r-1 4px`
  (inputs, chips), `r-2 8px` (cards, modals), `r-full` (avatar, pill stamps only).
  No large soft radii — that's the SaaS look we're avoiding.
- **Borders:** default `1px ink-200`; emphasis `2px ink-900` (the editorial "ruled
  line" — used for card hover, table header rules, blockquotes); focus ring
  `2px signal-500` + 2px offset.
- **Shadows:** near-none. `shadow-1: 0 1px 2px rgb(22 19 15 / 0.06)` (cards),
  `shadow-2: 0 8px 24px rgb(22 19 15 / 0.12)` (modals, popovers). Depth comes from
  rules and contrast, not blur.

## 5. Core components

### Listing card (marketplace card anatomy)

Top to bottom: (1) photo, 3:2, `r-0`, stamps overlaid top-left; (2) category
`caption` in `ink-500`; (3) title `h2`, max 2 lines; (4) meta row — seller name +
avatar, city; (5) price row — "From **$450**" in `price-lg` `ink-900` with per-tier
count ("3 packages") in `body-sm`; (6) footer rule (`2px ink-900` on hover) with
trust badges. Entire card is one link; hover = translate-y −2px + border emphasis, no
shadow bloom.

### Trust badges & status stamps

| Element | Style | Earned by |
|---|---|---|
| **Verified Seller** | pill, `ink-900` outline, check glyph | Admin identity verification |
| **Venue Approved** | pill, `success-600` outline | Venue approval record = Approved (PRD A-3) |
| **Proof Backed** | pill, `signal-700` outline | Listing commits to timestamped proof (all launch listings) |
| **BOOKED / COMPLETED / VERIFIED stamps** | uppercase `caption`, 2px border, slight −4° rotation, stamp color: signal-500 (Booked), success-600 (Completed) | State machine only — stamps are never manually applied |

Badges never appear without their earning condition being true in data (D-020).

### Buttons

| Variant | Style | Use |
|---|---|---|
| Primary | `ink-900` bg, `paper-0` text | Default primary action |
| Signal | `signal-500` bg, **`ink-900` text**, hover `signal-400`, active `signal-600` | The one conversion moment per page (Sponsor This / Checkout) |
| Secondary | transparent, `2px ink-900` border | Alternate actions |
| Ghost | text-only `ink-700`, underline on hover | Tertiary |
| Destructive | `danger-600` bg, white text | Cancel/refund/reject, always with confirm step |

Min height 44px (§10); loading state = spinner + verb ("Booking…"); disabled = 40%
opacity + `aria-disabled` + reason tooltip.

### Forms

Labels above inputs (`caption`, `ink-700`); inputs 44px min, `r-1`, `ink-200`
border, focus ring per §4; helper text `body-sm ink-500`; errors `danger-700` text +
border + icon, announced via `aria-describedby`. Money inputs show live math
("Buyers pay $787.50 · You receive $600.00") in mono.

### Tables (admin-heavy product)

`body-sm`, header row `caption` uppercase with `2px ink-900` bottom rule, zebra off,
row hover `paper-50`, right-aligned mono numerals for money, sticky header, each row's
primary entity is a link. Wide tables scroll horizontally inside the card, never the
page.

### Empty / loading / error states

Every surface implements all three (PRD X-6). Pattern: glyph (not illustration) +
one-line headline + one-line body + one action. Copy examples (honest per D-020):

- **Empty (buyer briefs):** "No briefs yet. Tell us what you want to sponsor — a
  human reviews every brief within 1 business day." → [Post a brief]
- **Empty (browse, small catalog):** "25 hand-picked Denver listings so far. Don't
  see it? We'll source it." → [Post a brief]
- **Loading:** skeleton blocks in `ink-100`, shimmer disabled under reduced motion.
- **Error:** "Something broke on our side. Your data is safe — try again, or email
  us and a human will fix it." → [Retry]. Never blame the user; never fake
  specificity about the cause.

## 6. Proof-of-completion visual language

Proof is the product's credibility; it gets its own visual grammar.

- **Timestamp chip:** mono `caption` on `ink-900` bg, white text, clock glyph —
  `"Mar 14, 2026 · 7:42 PM MST"` — overlaid bottom-left on every proof image.
  Two variants: **"metadata-verified"** (from EXIF/capture data, chip shows a check)
  and **"seller-attested"** (manual entry, chip shows an info glyph). The two are
  visually distinct and never conflated (D-020).
- **Camera metadata note:** beneath each proof asset, `body-sm ink-500`: device,
  capture time, GPS-present yes/no — or "No capture metadata available;
  seller-attested time shown."
- **Before/after grid:** two-up (mobile: stacked) with `caption` labels BEFORE /
  AFTER, shared 3:2 crop, 2px ink rule between — used for placements (empty table →
  branded table).
- **Deliverables map:** checklist rendering each promised deliverable → linked proof
  asset; unfulfilled items are visibly empty, never hidden.

## 7. Social-share card spec (auto-generated per listing)

**1200 × 630px** (Open Graph), generated at publish (`LIVE`) and regenerated on
material edit.

Layout: full-bleed listing photo, left 55%; right 45% `paper-0` panel with a
`2px ink-900` left rule containing — top: "SponsorThis" wordmark (`caption`,
ink-500); middle: listing title (`display-2`-equivalent, ink-900, max 3 lines), city
row ("Denver, CO" with pin glyph, `body-sm ink-500`), price ("From $450" in
`price-lg` mono, `signal-700`), seller row (avatar 32px + name, `body-sm`); bottom: a
`signal-500` button-shaped chip with `ink-900` text — **"Sponsor This →"**.
Overlay on the photo: earned stamps only (e.g., Proof Backed). Fallback when no
photo: `signal-50` field with oversized `signal-200` typographic texture of the
category name. Min text size 24px; contrast rules of §2 apply; no fabricated
audience/impression numbers ever appear on cards (D-020).

## 8. Campaign-report template (buyer deliverable at COMPLETED)

1. Cover: brand + campaign name, dates, city, hero proof photo, "Proudly sponsored"
   mark.
2. Summary: objective (from brief), package, price paid with fee breakdown (D-005
   transparency).
3. Deliverables vs. delivered: the §6 deliverables map, item by item.
4. Proof gallery: all assets with timestamp chips + metadata notes; before/after grid
   where applicable.
5. Disclosure evidence page (D-016/A-14).
6. Measured outcomes: **only observed numbers with source labels** (e.g., "photos
   delivered: 12; venue-stated attendance: 120 (unverified)"). No estimated
   impressions unless an evidence field exists; otherwise the line reads "no estimate
   provided" (D-020).
7. Next: rebooking CTA + related listings.

## 9. Accessibility — WCAG 2.1 AA (PRD X-7)

- Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI components); the §2 pairing
  rules exist to guarantee this — deviations require a measured ratio in the PR.
- Visible focus states everywhere (`2px signal-500` ring, 2px offset, never
  `outline: none` without replacement).
- Touch targets ≥ 44×44px (buttons, inputs, card tap areas, table row actions).
- Semantic landmarks per page: `header`, `nav`, `main`, `footer`; one `h1`; logical
  heading order; skip-to-content link.
- Status never conveyed by color alone — always label + (where iconic) glyph.
- Forms: programmatic labels, error association via `aria-describedby`, no
  placeholder-as-label.
- `prefers-reduced-motion`: disables shimmer, card hover translate, stamp rotation
  animation; transitions cap at 200ms regardless.
- Images: meaningful alt text; proof images alt-templated ("Proof photo: {deliverable}
  at {venue}, {timestamp}").

## 10. Responsive rules

Mobile-first; Tailwind breakpoints: `sm 640` · `md 768` · `lg 1024` · `xl 1280`.

- Content max-width 1200px; reading columns max 72ch.
- Listing grid: 1-up < `sm`, 2-up ≥ `sm`, 3-up ≥ `lg`.
- Nav collapses to a sheet menu < `md`; both primary CTAs remain one tap deep.
- Dashboards: tables become stacked key-value cards < `md`; admin is
  desktop-optimized but must remain operable at 375px (solo founder will run queues
  from a phone during stunts — see `25-launch-runbook.md`).
- Checkout and proof review are single-column at all widths; sticky summary/action
  bar on mobile (respecting 44px targets + safe areas).

## Open questions

1. Load Archivo/Inter from Google Fonts at launch, or ship system-stack-only and
   upgrade after Lighthouse baseline? Leaning system-only for launch week.
2. Stamp rotation (−4°) at small sizes may hurt legibility — test at 320px width
   before locking.
3. Share-card generation: build-time static render vs. on-demand edge OG image —
   decide with engineering in `14-technical-architecture.md`.
4. Dark mode is out of MVP scope; confirm no token names block adding a dark ramp
   later.
