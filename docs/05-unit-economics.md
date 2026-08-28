# 05 · Unit Economics

**Date:** 2026-08-28 · Conforms to D-005/D-006 (fees), D-008 (poker anchors, $40/hr
labor, payout ≈ 0.25% + $0.25), A-08 (Stripe rates), A-09 (5% reserve). Conventions:
**D-008 contribution** = platform gross take − processing − payout fee − direct labor
(the DECISIONS.md convention, used for the D-010 goal). **Fully-loaded contribution**
(this doc's template) additionally deducts reserves, creative, insurance, and commission.
Both are shown; they are different numbers on purpose.

---

## 1. Anchor: the poker listing (D-008, reproduced exactly)

| Tier | Price | Buyer pays (+5%) | Seller payout (80%) | Platform gross | Est. processing | Est. labor | Est. contribution |
|---|---|---|---|---|---|---|---|
| 1. Basic placement | $450 | $472.50 | $360.00 | $112.50 | $14.00 | $60 (1.5h) | ≈ $37 |
| 2. Placement + content | $750 | $787.50 | $600.00 | $187.50 | $23.14 | $80 (2h) | ≈ $83 |
| 3. Exclusive activation | $1,500 | $1,575.00 | $1,200.00 | $375.00 | $45.98 | $160 (4h) | ≈ $166 |

Verification of the arithmetic (Tier 2): gross $187.50 = 25% of $750; processing
$23.14 = 2.9% × $787.50 + $0.30; payout fee $1.75 = 0.25% × $600 + $0.25;
contribution $187.50 − $23.14 − $1.75 − $80 = **$82.61 ≈ $83**. ✔ (Tiers 1 and 3 check
identically: $37.35 and $165.77.)

## 2. Per-order P&L template (generalized)

Every campaign, self-serve or managed, is scored on this template in the ops log. Lines
marked ⊕ are excluded from the D-008 convention and included in fully-loaded contribution.

| Line | Self-serve formula | Managed formula |
|---|---|---|
| GMV (package/campaign price) | P | P |
| Buyer fee | +5% × P | — (all-in price) |
| Seller/vendor payout | 80% × P | ≈60% × P (40% GM midpoint of D-006's 35–50%) |
| **Platform revenue** | 25% × P (20% seller-side + 5% buyer fee) | ≈40% × P |
| Processing | 2.9% × 1.05P + $0.30 | 2.9% × P + $0.30 |
| Payout fee | 0.25% × 0.80P + $0.25 | 0.25% × 0.60P + $0.25 |
| ⊕ Refund reserve | 3% × P | 3% × P |
| ⊕ Chargeback reserve | 2% × P | 2% × P |
| Support + concierge labor | hours × $40 (support time included in hours) | hours × $40 |
| ⊕ Creative labor (contractor) | usually $0 (seller shoots) | ~$100/campaign typical |
| ⊕ Insurance (when applicable) | rarely | ~$75 event rider on ~25% of campaigns |
| ⊕ Sales commission | 10% × platform revenue **when non-founder sold** | same |
| ⊕ CAC (allocated) | tracked per buyer, not per order (§5) | same |

Reserves are accruals, not cash out the door; they are released against actual
refund/chargeback experience (A-09 falsifier: reserve consumed >80% in any month).

## 3. Contribution per order — self-serve vs. managed at three AOVs

### Self-serve (founder-sold, no creative/insurance; support hours per D-008 tiers)

| | $450 | $750 | $1,500 |
|---|---|---|---|
| Platform revenue (25%) | $112.50 | $187.50 | $375.00 |
| Processing | $14.00 | $23.14 | $45.98 |
| Payout fee | $1.15 | $1.75 | $3.25 |
| Labor (1.5h / 2h / 4h) | $60.00 | $80.00 | $160.00 |
| **D-008 contribution** | **$37.35** | **$82.61** | **$165.77** |
| ⊕ Reserves (5% GMV) | $22.50 | $37.50 | $75.00 |
| **Fully-loaded contribution** | **$14.85** | **$45.11** | **$90.77** |
| Fully-loaded margin (of platform rev) | 13% | 24% | 24% |

### Managed (8h launch-era labor, $100 creative; insurance shown where applicable)

| | $1,500 (min, D-006) | $2,200 (base AOV) | $5,000 |
|---|---|---|---|
| Platform revenue (40%) | $600.00 | $880.00 | $2,000.00 |
| Processing | $43.80 | $64.10 | $145.30 |
| Payout fee | $2.50 | $3.55 | $7.75 |
| Labor (8h) | $320.00 | $320.00 | $320.00 |
| Creative | $100.00 | $100.00 | $100.00 |
| **D-008-style contribution** | **$133.70** | **$392.35** | **$1,426.95** |
| ⊕ Reserves (5%) | $75.00 | $110.00 | $250.00 |
| ⊕ Insurance rider (if needed) | $75.00 | — | — |
| **Fully-loaded contribution** | **−$16.30** | **$282.35** | **$1,176.95** |
| ⊕ If non-founder sold (10% commission) | −$76.30 | $194.35 | $976.95 |

**The three honest findings in this table:**
1. A $1,500 minimum managed campaign at 8 hours with an insurance rider is **break-even
   to negative** fully loaded. The D-006 minimum is only safe at ≤6h, or without
   rider/creative, or priced above minimum. Rule: quote insurance-rider campaigns at
   ≥$2,000, never the floor.
2. Self-serve at $450 barely clears $15 fully loaded — the $250 floor (D-005) exists to
   keep the worst case non-negative, not to make money. Sub-$750 self-serve is a
   funnel/liquidity product, not a profit product.
3. Managed at $5,000 carries the whole early P&L (~$1,200 fully loaded). One per month
   changes everything; sell up-band.

## 4. Operational leverage curve (A-07: 8h → 2h)

Managed campaign at base AOV $2,200, founder-sold, no rider, fully-loaded convention.
Labor is the single largest controllable line; this curve is the scale thesis.

| Concierge hours | Labor cost | Fully-loaded contribution | Margin (of $880 platform rev) | Stage |
|---|---|---|---|---|
| 8h | $320 | $282.35 | 32% | Launch reality (campaigns 1–5) |
| 6h | $240 | $362.35 | 41% | A-07 target by campaign #10 |
| 4h | $160 | $442.35 | 50% | Templatized proof/permits; gate for white-label & self-serve rush (doc 04) |
| 2h | $80 | $522.35 | 59% | Software-assisted steady state; managed margin lands at top of D-006's 35–50% band |

Same curve at the $1,500 minimum: −$16 → $64 → $144 → $224. The minimum-fee campaign
goes from money-loser to 37% margin purely on ops leverage. Mechanisms that move hours
down (tracked per campaign in the ops log, A-07): reusable package templates, proof
checklist automation, venue-approval template library, batch scheduling of shoots,
self-serve proof upload. Kill signal: >10h/campaign with no downward trend at n≥10.

## 5. CAC and payback

CAC is tracked per **buyer**, not per order (repeat purchases share one acquisition).
- **A-11 target:** founder-led CAC ≤ $400 cash per paid campaign in month 1 (lists,
  tools, small paid tests; founder time priced at $0 by convention but hours logged).
- **Payback at base mix:** first managed campaign contributes ~$282–$392 (table §3) →
  CAC ≈ paid back within the first campaign at 8h labor, definitively inside it at ≤6h.
  Self-serve-only buyers at $750 (≈$45 fully loaded) need ~9 orders to cover a $400 CAC —
  which is why cold CAC dollars are only spent on managed-tier prospects (doc 03
  segments 1–2), and self-serve demand rides on PR/case studies/repeat.
- **Kill signal (A-11):** CAC > $1,000 with < 20% proposal-win rate.

## 6. Repeat-purchase value model

With per-cycle rebooking probability *r*, expected campaigns per buyer ≈ 1/(1−r)
(geometric; no discounting at these horizons).

| Segment (doc 03 est.) | r (HYPOTHESIS) | Expected campaigns | Contribution/campaign (mix) | Expected buyer contribution | Supported CAC at 3× |
|---|---|---|---|---|---|
| Agency | 0.5 | 2.0 | $390 (managed $2.2k, 6h) | ~$780 | ~$260 |
| Startup/DTC | 0.3 | 1.4 | $280 (managed/self-serve mix) | ~$400 | ~$130 |
| Local business | 0.25 | 1.3 | $85 (self-serve $750–$1.5k) | ~$115 | ~$40 |

Read: agencies justify real acquisition effort; local businesses only justify
near-zero-CAC channels (walk-ins, referrals, PR) — matching D-004's ordering. These *r*
values are unvalidated (A-02, A-10); the table's job is to be falsified by the first 20
campaigns. Proof packages are the main repeat lever we control (A-10: compare rebooking
with/without full proof delivery).

## 7. What must be true for the model to work (summary)

1. Labor falls to ≤6h by campaign #10 (A-07) — else managed margin collapses to
   services-business levels.
2. Refund+chargeback experience stays under the 5% accrual (A-09) — else add ~2–3
   points of GMV drag and reprice.
3. Managed AOV holds ≥ $2,000 average — the $1,500 floor is a floor, not a target.
4. At least one segment shows r ≥ 0.3 at n≥10 (A-02/A-10) — else every campaign pays
   full CAC and doc 21's base case is unreachable.

## Open questions

1. Should the refund reserve differ by inventory type (weather-exposed outdoor moments
   vs. indoor placements)? Revisit after 20 campaigns of actual data.
2. Is $100/campaign contractor creative realistic in Denver for shoot+edit? Get three
   contractor quotes; if it's $200+, managed minimums move up ~$150.
3. Founder time is priced at $0 in CAC but $40/hr in fulfillment — inconsistent by
   design (CAC convention isolates cash; fulfillment convention prices scalability).
   Confirm everyone reads the two conventions correctly or unify.
4. Do we accrue reserves on managed pass-through line items (which can be large) or only
   on our fee? Current model: on full GMV (conservative). Revisit with dispute data.
