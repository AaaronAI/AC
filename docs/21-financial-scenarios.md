# 21 · Financial Scenarios — 12 Months

**Date:** 2026-08-28 · Machine-readable model: `data/financial-model.csv` (every number
below ties to it; the CSV is generated from the same formulas). Conforms to D-005/D-006
(fees), D-008 ($40/hr labor), A-08 (Stripe rates), A-09 (5% reserves).
**These are models, not measurements** (ASSUMPTIONS.md). No scenario is a forecast; they
bracket outcomes for planning cash and decisions.

---

## 1. Shared model mechanics (all scenarios)

- **Self-serve order:** platform revenue = 20% of package price; buyer fee = 5%;
  processing = 2.9% × (1.05 × package) + $0.30; payout fee = 0.25% × (80% × package) + $0.25.
- **Managed campaign:** all-in price; platform revenue = 40% of price (midpoint of
  D-006's 35–50% GM target); 60% passes through to sellers/vendors; processing = 2.9% ×
  price + $0.30; payout fee = 0.25% × (60% × price) + $0.25. No buyer fee (all-in).
- **Reserves:** refund 3% + chargeback 2% of GMV, accrued monthly (A-09).
- **Ops labor:** $40/hr fully loaded (D-008). Managed hours/campaign decline per
  scenario (the A-07 leverage curve, doc 05 §4); self-serve support hours flat per scenario.
- **Creative labor:** flat per managed campaign ($120 conservative, $100 base/upside).
- **Sales commission:** 10% of managed platform revenue × share of deals sold by
  non-founders (0% until a contractor seller starts).
- **Tools:** $300/mo flat (stack + Stripe Connect active-account fees).
- **Insurance:** $100/mo general policy + $75 event rider on an assumed 25% of managed
  campaigns → $100 + $18.75 × managed campaigns.
- **CAC spend:** cash only (lists, sales tools, small paid tests); founder time excluded
  by convention (doc 05 §5).
- **Contribution margin** = platform revenue + buyer fees − processing − payout fees −
  reserves − ops labor − creative − commission − tools − insurance − CAC. This is the
  fully-loaded convention (doc 05), stricter than the D-008 convention used for the
  D-010 goal.
- **Managed-first gating (D-001):** self-serve campaigns are zero until ≥10 campaigns
  have completed; each scenario respects this (self-serve starts m5 / m4 / m3).

## 2. Scenario inputs (stated inline, per the honesty rule)

| Input | Conservative | Base | Upside |
|---|---|---|---|
| Managed campaigns m1→m12 | 2→7 (54 total) | 4→10 (81 total) | 4→16 (125 total) |
| Self-serve campaigns m1→m12 | 0→5 from m5 (21 total) | 0→12 from m4 (60 total) | 0→30 from m3 (147 total) |
| Managed AOV | $1,800 | $2,200 | $2,500 |
| Self-serve AOV | $600 | $750 | $900 |
| Managed hours/campaign | 8h → 5h | 8h → 4h | 8h → 2h |
| Self-serve support hours | 2.0h | 1.5h | 1.0h |
| Creative per managed campaign | $120 | $100 | $100 |
| Non-founder-sold share | 0% all year | 30% from m7, 40% from m10 | 50% from m5 |
| CAC spend/mo | $250 | $400→$800 | $500→$1,500 |

What each scenario *means*: **Conservative** = demand is real but thin (D-010 missed in
month 1 — 2 campaigns, $3.6k cash), ops leverage comes slowly, founder sells everything.
**Base** = D-010 hit in month 1 (4 managed campaigns, $8.8k cash), A-07 leverage on
schedule, a contractor seller works out from m7. **Upside** = a stunt lands press
(D-017), self-serve unlocks m3, leverage reaches 2h, sales are half-delegated. Upside is
an execution claim that exceeds the doc-01 Denver reach sketch's default assumptions —
it requires inbound, not just outbound.

## 3. Conservative scenario

| | m1 | m2 | m3 | m4 | m5 | m6 | m7 | m8 | m9 | m10 | m11 | m12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Campaigns (mgd+ss) | 2 | 2 | 3 | 3 | 5 | 5 | 7 | 7 | 9 | 9 | 11 | 12 |
| GMV $ | 3,600 | 3,600 | 5,400 | 5,400 | 7,800 | 7,800 | 10,200 | 10,200 | 12,600 | 12,600 | 15,000 | 15,600 |
| Platform revenue $ | 1,440 | 1,440 | 2,160 | 2,160 | 3,000 | 3,000 | 3,840 | 3,840 | 4,680 | 4,680 | 5,520 | 5,640 |
| Contribution $ | −418 | −418 | −303 | −183 | −7 | −7 | 369 | 369 | 585 | 825 | 1,081 | 1,100 |
| Cumulative $ | −418 | −837 | −1,139 | −1,322 | −1,329 | −1,336 | −967 | −598 | −13 | 812 | 1,892 | 2,993 |

**FY:** 75 campaigns · $109.8k GMV · $42.0k revenue · **$3.0k contribution**.
Honest reading: **months 1–6 are contribution-negative; months 1–3 are far below
$3k/mo** — the possibility the brief requires us to state plainly. The D-010 30-day gate
is missed (2 campaigns, $3,600 cash), so in this world the kill/pivot review (doc 00 §10)
triggers at day 30 — this scenario is what we'd be shutting down or pivoting *from*,
caught early and cheaply (cumulative trough only −$1,336 in cash-model terms).

## 4. Base scenario

| | m1 | m2 | m3 | m4 | m5 | m6 | m7 | m8 | m9 | m10 | m11 | m12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Campaigns (mgd+ss) | 4 | 4 | 5 | 7 | 9 | 10 | 12 | 14 | 16 | 18 | 20 | 22 |
| GMV $ | 8,800 | 8,800 | 11,000 | 12,500 | 15,450 | 16,200 | 19,150 | 22,100 | 23,600 | 26,550 | 28,050 | 31,000 |
| Platform revenue $ | 3,520 | 3,520 | 4,400 | 4,700 | 5,730 | 5,880 | 6,910 | 7,940 | 8,240 | 9,270 | 9,570 | 10,600 |
| Contribution $ | 254 | 254 | 718 | 748 | 1,357 | 1,422 | 1,826 | 2,248 | 2,699 | 2,882 | 3,012 | 3,465 |
| Cumulative $ | 254 | 509 | 1,227 | 1,975 | 3,332 | 4,754 | 6,580 | 8,828 | 11,527 | 14,408 | 17,420 | 20,886 |

**FY:** 141 campaigns · $223.2k GMV · $82.5k revenue · **$20.9k contribution**.
D-010 check, month 1: 4 campaigns ✔ · $8,800 cash ✔ · D-008-convention contribution
≈ $1,570 (revenue 3,520 − processing 256 − payout 14 − labor 1,280 − creative 400) ✔
clears the ≥$1,500 gate. Note even the base case runs below $3k/mo fully-loaded
contribution through month 8 — this business is founder-subsidized for most of year 1.

## 5. Upside scenario

| | m1 | m2 | m3 | m4 | m5 | m6 | m7 | m8 | m9 | m10 | m11 | m12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Campaigns (mgd+ss) | 4 | 6 | 10 | 13 | 16 | 19 | 23 | 27 | 31 | 36 | 41 | 46 |
| GMV $ | 10,000 | 15,000 | 20,200 | 24,500 | 28,800 | 33,100 | 38,300 | 43,500 | 48,700 | 54,800 | 60,900 | 67,000 |
| Platform revenue $ | 4,000 | 6,000 | 7,540 | 8,900 | 10,260 | 11,620 | 13,160 | 14,700 | 16,240 | 17,960 | 19,680 | 21,400 |
| Contribution $ | 538 | 1,497 | 2,257 | 3,237 | 3,237 | 4,287 | 4,837 | 6,117 | 6,707 | 7,658 | 9,208 | 10,199 |
| Cumulative $ | 538 | 2,034 | 4,291 | 7,528 | 10,765 | 15,052 | 19,889 | 26,006 | 32,713 | 40,371 | 49,579 | 59,777 |

**FY:** 272 campaigns · $444.8k GMV · $158.1k revenue · **$59.8k contribution**.
Reality check: m12 requires 16 managed + 30 self-serve campaigns/month at 2h managed
labor — ~62 ops hours/month plus selling. That is only feasible with the software doing
real work and a contractor bench; treat this scenario as the argument *for* the product
investment, not as a promise.

## 6. Founder cash need

Contribution margin excludes any founder draw. At a modest $5,000/mo founder living draw:

| Scenario | FY contribution | FY founder draw | Net founder cash need (12 mo) |
|---|---|---|---|
| Conservative | $3.0k | $60k | ≈ **$57k** (but see note — we'd kill at day 30–90, actual exposure ≈ $5–15k + foregone salary) |
| Base | $20.9k | $60k | ≈ **$39k** |
| Upside | $59.8k | $60k | ≈ **$0** (breakeven on draw by year-end) |

Add a working-capital buffer of ~$5k (refund reserve is accrued in the model but cash
sits with us until claimed; the buffer covers timing and a surprise dispute cluster).
Planning number: **$45–50k personal runway or equivalent** to run the base case
comfortably for 12 months.

## 7. Break-even analysis

- **Contribution break-even (fully loaded, >$0/mo):** conservative m7 · base m1 · upside m1.
- **Founder-salary break-even (≥$5k/mo contribution):** conservative — not within 12
  months (m12 = $1.1k); base — not within 12 months (m12 = $3.5k; on trend ≈ m14–16);
  upside — m8 ($6.1k).
- **Structural break-even condition:** at base-mix economics (~$390 fully-loaded
  contribution per managed campaign at 6h, ~$45 per self-serve order — doc 05), covering
  $5k/mo + ~$700 fixed (tools, insurance, CAC floor) needs ≈ **13–15 managed campaigns/
  month** or equivalent mix. That is the number one full-time founder plus software must
  reach; everything in A-07 (labor) and A-02/A-10 (repeat) either shortens or lengthens
  the road to it.

## 8. Fundraising vs. bootstrapping implications

- **Conservative world:** do not fundraise — there is nothing yet to fund. The correct
  move is the day-30/60 kill-pivot review (doc 00). Total tuition is small by design.
- **Base world:** **bootstrappable** with ~$45–50k founder runway. Fundraising is
  optional and arguably premature: $20.9k FY contribution with rising monthly trend and
  a repeat-buyer cohort is a fine angel story at month ~9 *if* we want to compress the
  city-expansion timeline (D-018) — raise for expansion speed, not survival.
- **Upside world:** default alive. Raising becomes a choice about multi-city pace;
  the data (repeat rates, leverage curve, per-city payback) would justify a seed round
  on evidence rather than narrative. Do not raise before the self-serve gate (D-001)
  proves the model isn't just a founder-services business.
- **In all worlds:** the D-009 discipline holds — we report contribution and repeat
  rate, not GMV, to any investor. A GMV-led pitch of this business would be dishonest;
  60% of managed GMV is pass-through.

## Open questions

1. The 40% managed GM midpoint: early quotes may land nearer 35% under negotiation —
   rerun the CSV at 35% before committing to the base-case cash plan (sensitivity:
   roughly −$110/campaign at $2,200 AOV).
2. Is 25% rider incidence right for insurance? Broker conversation will reset this line.
3. Contractor salesperson at 10% of platform revenue only — is that competitive for
   B2B sales talent in Denver, or does it need a base? (If base required, add
   ~$1.5–2k/mo from m7 in base scenario; contribution falls accordingly.)
4. Seasonality is not modeled (flat monthly ramps). Denver winters will dent
   outdoor-inventory months (doc 03 open question 3); the mix shift to indoor inventory
   is unpriced.
