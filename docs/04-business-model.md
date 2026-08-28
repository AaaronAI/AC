# 04 · Business Model

**Date:** 2026-08-28 · Conforms to D-005 (self-serve fees), D-006 (managed pricing),
D-007 (deferred subscriptions/auctions), D-008 (economics anchors), D-009 (metrics).
All processing math uses Stripe-published rates (2.9% + $0.30 card; 0.25% + $0.25
payout — verified in doc 01; Connect also bills $2/mo per active connected account,
absorbed in the tools line of doc 21).

---

## 1. Revenue architecture (launch)

Two live streams, one deferred class:

| Stream | Mechanics | Canon |
|---|---|---|
| **Self-serve bookings** | Fixed-price packages. 20% platform fee deducted from seller payout + 5% buyer service fee at checkout. Processing absorbed by platform. $250 minimum package. Sellers never pay to list. | D-005 |
| **Managed campaigns** | All-in quoted price, 35–50% gross margin target before fixed overhead. $1,500 minimum fee. Production/permits/insurance/merch/staffing/travel = pass-through + 15% coordination markup. Rush (<10 business days): +20%. | D-006 |
| **Subscriptions ($299–$499/mo) & auctions** | DEFERRED. Plans revisited after 3 repeat buyers; auctions only for scarce inventory with proven demand. | D-007 |

The managed stream is the month-1–6 revenue engine (D-001); self-serve fees are the
long-term margin engine. Same rails (booking, payment, state machine, proof) serve both.

## 2. Pricing-structure comparison

Three candidate structures, worked at the four canonical order values. "Net" = platform
gross take − processing − payout fee, before labor/reserves (D-005 convention).

### Structure A — 20% seller-side + 5% buyer fee (CHOSEN, D-005)

| Package | Buyer pays | Seller gets | Platform gross | Processing | Payout fee | Net |
|---|---|---|---|---|---|---|
| $450 | $472.50 | $360.00 | $112.50 | $14.00 | $1.15 | **$97.35** |
| $750 | $787.50 | $600.00 | $187.50 | $23.14 | $1.75 | **$162.61** |
| $1,500 | $1,575.00 | $1,200.00 | $375.00 | $45.98 | $3.25 | **$325.77** |
| $5,000 | $5,250.00 | $4,000.00 | $1,250.00 | $152.55 | $10.25 | **$1,087.20** |

### Structure B — flat 25% seller-side, no buyer fee

| Package | Buyer pays | Seller gets | Platform gross | Processing | Payout fee | Net |
|---|---|---|---|---|---|---|
| $450 | $450.00 | $337.50 | $112.50 | $13.35 | $1.09 | **$98.06** |
| $750 | $750.00 | $562.50 | $187.50 | $22.05 | $1.66 | **$163.79** |
| $1,500 | $1,500.00 | $1,125.00 | $375.00 | $43.80 | $3.06 | **$328.14** |
| $5,000 | $5,000.00 | $3,750.00 | $1,250.00 | $145.30 | $9.63 | **$1,095.07** |

### Structure C — 15% seller-side + buyer SaaS ($299/mo, D-007 band)

| Package | Buyer pays (excl. sub) | Seller gets | Platform gross (transactional) | Processing | Payout fee | Net (transactional) |
|---|---|---|---|---|---|---|
| $450 | $450.00 | $382.50 | $67.50 | $13.35 | $1.21 | **$52.94** |
| $750 | $750.00 | $637.50 | $112.50 | $22.05 | $1.84 | **$88.61** |
| $1,500 | $1,500.00 | $1,275.00 | $225.00 | $43.80 | $3.44 | **$177.76** |
| $5,000 | $5,000.00 | $4,250.00 | $750.00 | $145.30 | $10.88 | **$593.82** |

Plus $299/mo per subscribing buyer. Break-even vs. A: a buyer must transact ≈ $2,700+/mo
(≈2 × $1,500 packages) before C's sub + 15% matches A's net on the same volume.

### Recommendation: Structure A (matches canon)

- **A vs. B:** economically near-identical (B nets $0.71–$7.87 more per order via lower
  processing on the uncharged buyer fee). We still choose A: the 5% buyer fee funds
  buyer-side protection visibly and lets us quote sellers "you keep 80%" — a rounder,
  friendlier number than 75% at effectively the same platform economics. Comparables
  say both sides accept this exact split shape (Fiverr 20%/5.5%, doc 01). Risk tracked:
  A-04 (buyer-fee conversion drag); falsifier is fee cited in >20% of lost deals.
- **A vs. C:** C is catastrophically worse pre-liquidity — it halves transactional net at
  every order value and asks buyers to subscribe before we've proven one campaign. SaaS
  belongs *on top of* proven repeat usage, which is exactly D-007's deferral logic
  (revisit at 3 repeat buyers). C also selects against segment-3 local one-shot buyers
  who carry the 30-day cash goal (doc 03).
- **Sensitivity:** at 5h of concierge assist ($200, doc 05) a $450 order is contribution-
  negative under every structure — the fee structure is not the problem at small AOVs;
  labor is. Hence the $250 floor and the ops-leverage mandate (A-07), not a higher take.

## 3. Do not charge sellers to list (D-005) — rationale

1. **Supply is the scarce side.** Nobody wakes up knowing their poker entry is
   sellable inventory; we are *creating* the seller category. Any listing fee taxes the
   exact behavior we need most (A-05: ≥50 credible moments/quarter).
2. **Listing fees select for the wrong sellers** — they filter for confidence, not
   quality; our moderation layer (D-016) is the quality filter, and it's better.
3. **We monetize success, not hope.** 20% of a completed, proof-accepted campaign aligns
   us with sellers; $10 listing fees would earn rounding-error revenue while poisoning
   A-03 goodwill (sellers accepting 80% partly because the platform is free until it works).
4. **Comparables:** every marketplace we studied (doc 01) with healthy long-tail supply —
   Fiverr, Collabstr, Cameo, SponsorMyEvent — lists free and takes a success fee.

## 4. Additional revenue lines — evaluate later, each with a stage-gate

Each line: one-paragraph evaluation + the gate that turns it on. None is in the MVP; none
may launch before its gate (this doc is the gate registry).

**1. Content editing & production upgrades.** Sellers produce raw content; many buyers
want edited, brand-safe cuts. We already pay contractor creative labor on managed
campaigns (doc 05), so selling editing as a $150–$500 add-on converts an existing cost
center into revenue with ~50% contractor margin. Highest-confidence line; also deepens
the "content output is the ROI anchor" positioning (doc 01 §5).
*Gate:* ≥5 completed campaigns where the buyer asked for edits or reused content;
contractor bench of ≥2 editors at agreed rates.

**2. Usage-rights upgrades.** Base packages include 12-month organic social rights
(doc 02 §3); paid-media usage, whitelisting, and perpetuity are classic influencer-market
upsells with near-100% margin. Simple to sell (a checkbox at checkout), but requires
clean rights language reviewed by counsel first.
*Gate:* counsel-approved rights template in listings; ≥3 buyer requests logged for paid
usage.

**3. Exclusivity premiums.** Category lockout (e.g. "only energy-drink at this event
series") priced at +25–100% of package. Pure-margin but consumes inventory optionality
and complicates rebooking of the same seller. Sell only on inventory with demonstrated
multi-buyer interest, otherwise we're giving away an option for free.
*Gate:* first instance of two buyers competing for the same listing window.

**4. Rush fees.** Already canon for managed (+20% under 10 business days, D-006).
Extend to self-serve later as a delivery-speed toggle. Trivial to implement; the risk is
ops overload — rush revenue that costs 3 extra concierge hours is negative margin.
*Gate for self-serve rush:* median campaign labor ≤ 4h (doc 05 leverage curve) so rush
capacity actually exists.

**5. Insurance coordination.** We already carry/coordinate coverage on managed campaigns
(pass-through +15%, D-006). Productizing it for self-serve (per-event rider arranged at
checkout) removes a real buyer/venue objection (A-06) — but brokering has licensing
implications; we coordinate, never underwrite or advise.
*Gate:* broker relationship signed; counsel confirms coordination model is
license-exempt; ≥3 venues having demanded certificates.

**6. Merch fulfillment.** Branded tees/banners/wraps for campaigns, pass-through +15%
today (D-006). A standing print partner with negotiated rates could yield 20–30% margin
on ~$100–$500 per campaign. Low strategic value, real logistics tax — keep as
pass-through until volume makes a partner deal worth one founder-day.
*Gate:* ≥10 campaigns/month including physical merch.

**7. Data products.** Pricing benchmarks for long-tail sponsorship (a micro-SponsorUnited,
doc 01 §1.3) built from our transaction data. Genuinely differentiated *eventually*;
worthless below ~500 transactions, and selling data about our own sellers/buyers has
trust and privacy costs. Park it.
*Gate:* ≥500 completed campaigns AND a privacy policy + seller consent framework
reviewed by counsel.

**8. White-label / agency API.** Agencies (ICP-1) reselling our inventory under their
brand — plausibly demanded early (doc 03 open question 1). Economically attractive
(volume commitment against discounted take, e.g. 15% platform share on committed
$10k+/quarter) but dangerous before ops leverage exists: white-label buyers demand SLAs
we can't yet honor at 8h/campaign.
*Gate:* self-serve unlocked (D-001: ≥10 campaigns, ≥3 repeat buyers) AND median labor
≤ 4h AND ≥2 agencies with ≥3 completed campaigns each asking for it.

## 5. Stream interaction and metric discipline

- Managed campaigns feed self-serve: every managed campaign should mint reusable
  package templates and at least one repeat-bookable listing.
- The operating metric remains **contribution margin from completed campaigns**, then
  **repeat buyer rate** (D-009). Revenue lines that add GMV but not contribution (merch
  pass-through) are explicitly not wins. Cash collected in 30 days ranks above GMV.
- Fee changes are DECISIONS.md changes first (canon discipline); no promotional
  discounting of the 20%/5% at launch — discount the *package price* on managed deals if
  needed, never the take rate (protects the pricing data self-serve will run on, D-001).

## Open questions

1. A-04 test design: fee-inclusive vs. line-item display of the 5% buyer fee — which
   converts better at $750 vs. $5,000? (A/B on proposals per ASSUMPTIONS.md.)
2. Should managed campaigns above $10k (if they appear) get a negotiated-margin band
   below 35%? Current answer: no — refer them out or split into phases; revisit with
   real demand.
3. Sales commission interaction: the 10% commission on non-founder-sold platform revenue
   (doc 05) — does it apply to add-on lines (editing, rights)? Proposed: yes, same 10%,
   decide before first contractor seller starts.
4. When subscriptions un-defer (D-007), do subscribers get the Structure-C 15% rate or
   keep 20% with other perks? Comparables (Collabstr Premium 5% buyer-side discount,
   doc 01) suggest discounting the *buyer* fee, not the seller-side take. Decide at gate.
