# 24 · Investor Narrative — Honest Pre-Seed Story

Owner: Founder. Conforms to `DECISIONS.md` (D-001–D-010, D-020) and
`ASSUMPTIONS.md`. This is the narrative backbone for a pre-seed conversation — not a
deck, and not a set of claims. Where a number is a model, it says so. Section 9 lists
what we refuse to claim.

---

## 1. The wedge story

The world is full of ad space nobody can buy. A regular at a Denver poker tournament,
a dog walker crossing three parks a day, a hundred bike commutes — real attention,
real context, zero purchase path: no price, no contract, no approval process, no
proof, no one to call.

SponsorThis is the purchase path. We start with one absurdly specific wedge —
**verified sponsorable moments in Denver, sold as fixed packages with timestamped
proof** (D-003) — because the wedge forces us to build the hard, durable things:
venue approvals, permits, disclosure compliance, payment holds, proof standards.
The first flagship listing ("Sponsor Aaron at a $200 Denver poker tournament,"
D-008, tiers $450/$750/$1,500) is deliberately small, deliberately weird, and
deliberately end-to-end real: it exercises every system the category needs —
including the hardest ones (venue permission, gambling adjacency handled with
counsel, no-stake fee structure).

The wedge generalizes: people → objects → spaces → events → stunts, one city at a
time (D-018). The company that standardizes "sponsor anything, with proof" gets to be
the transaction layer for a category that currently clears through DMs, favors, and
one-off agency deals.

## 2. Why now

1. **The creator economy normalized sponsorship of individuals.** A decade of
   influencer marketing taught brands to pay people (not media companies) and taught
   people that sponsorship is a normal, non-embarrassing income line. What hasn't
   been productized is the offline, real-world version of that same behavior.
2. **Brands are hungry for authentic real-world content.** Performance channels are
   saturated and increasingly distrusted; brands pay premiums for content that reads
   as real life. A branded moment that actually happened — with photos of it actually
   happening — is exactly the raw material their social/content teams want.
3. **Proof and measurement tech is finally cheap.** Timestamped/geotagged capture,
   lightweight e-sign agreements, and programmable payments (Stripe Connect-style
   holds and releases) make it economically feasible to verify a $750 transaction —
   which is the whole reason this category never worked before: verification cost
   used to exceed the deal size.
4. **Regulatory clarity favors the honest version.** FTC endorsement rules are
   explicit; a platform whose brand *is* disclosure ("proudly sponsored,"
   `11-brand-strategy.md` §6) turns compliance into a moat rather than a drag.

We do not claim a market-size number here; comparable-market reasoning lives in
`01-market-and-competitor-research.md` and is labeled as reasoning, not data (D-020).

## 3. Business model

Two revenue lines (D-005, D-006):

| Line | Mechanics | Economics |
|---|---|---|
| Marketplace bookings | Fixed packages + brief-matched offers; min $250, target AOV $750–$5,000 | 20% platform fee (seller side) + 5% buyer fee; processing absorbed by us |
| Managed campaigns | Concierge-produced activations, min fee $1,500 | 35–50% target gross margin; pass-throughs +15% coordination; rush +20% |

Worked anchor (real seed listing, D-008): a $750 package → buyer pays $787.50,
seller receives $600.00, platform gross $187.50, net ≈ $162.61 after processing and
payout costs, ≈ $83 contribution after ~2h concierge labor at $40/hr. Tier 3
($1,500) contributes ≈ $166. These are **modeled** numbers built from published
processor pricing (A-08) and labor estimates (A-07) — no transaction has validated
them yet.

Deferred by design (D-007): subscriptions ($299–$499 brand/agency plans) after ≥3
repeat buyers; auctions only for provably scarce inventory.

## 4. Unit economics summary

Full model: doc 05 (unit economics) and `21-financial-scenarios.md` /
`data/financial-model.csv`. All scenarios are models, not measurements
(`ASSUMPTIONS.md`, explicitly-unvalidated section). The shape that matters:

- **Contribution per completed booking** is positive from roughly $400 AOV upward at
  launch labor rates, and scales with AOV faster than labor does (labor is
  step-fixed per campaign; take is proportional).
- The operating metric is **contribution margin from completed campaigns**, then
  **repeat buyer rate**; cash collected in 30 days ranks above GMV; signups and
  followers are explicitly not success metrics (D-009).
- First-30-days goal: 3–5 paid campaigns, ≥ $5,000 cash collected, ≥ $1,500
  contribution margin (D-010), with kill/pivot gates in
  `23-kill-pivot-continue-criteria.md`.
- Key sensitivities we watch honestly: concierge hours per campaign (A-07: ≤ 6h by
  campaign #10 or the model breaks), venue-approval rate (A-06), refund reserve
  sufficiency (A-09), founder-led CAC (A-11: ≤ $400/paid campaign month 1).

## 5. The moat build

Nothing about campaign #1 is defensible. The thesis is that **operating the managed
marketplace deposits nine compounding assets** (canon per `20-city-expansion.md`),
each strengthened by every completed transaction:

| Asset | What it is | How it compounds with volume |
|---|---|---|
| Supply graph | Curated, verified sellers + venues + their relationships | Each city cohort makes the next recruit warmer; sellers refer sellers; coverage becomes the catalog a competitor can't cold-start |
| Reliability history | Per-seller completion, on-time proof, response, revision data (`08-marketplace-design.md` §5) | Only accrues through real transactions on-platform; buyers route to proven sellers, which concentrates more history — a data flywheel competitors can't scrape |
| Pricing benchmarks | Accepted offers + completed bookings by category/city | Every deal improves guidance → better conversion → more deals; becomes "the Kelley Blue Book of sponsorable moments" |
| Venue & permit knowledge | Which venues say yes, on what terms, and how long Denver permits actually take (A-06, A-16) | Institutional knowledge per city; cuts cycle time and failure rates; largest cost advantage in new-city playbooks |
| Standardized agreements | Sponsorship, disclosure, venue, and no-stake structures (counsel-reviewed) | Templates amortize legal cost to ~zero per deal; novel structures (e.g., gambling-adjacent) become reusable IP |
| Proof infrastructure | Timestamp/metadata capture, deliverables mapping, campaign reports (`12-design-system.md` §6–8) | Proof standards become the buyer's procurement requirement — "SponsorThis-grade proof" — raising rivals' spec |
| Agency workflows | Repeat-buyer tooling: briefs, proposals, reports, (later) seats | Agencies embed us in their process; repeat volume raises switching cost on their side, not ours |
| Brand | "Proudly sponsored," the honest, premium, slightly weird label for the category | Category-defining names accrue meaning with every public case study; disclosure-first positioning is hard to copy late |
| Transaction data | Everything above, joined: what sold, at what price, with what outcome | The training set for eventual automated matching and pricing — deliberately deferred (D-001) until the data exists |

The honest caveat: today these are empty containers. The pre-seed bet is that the
managed motion fills them faster and cheaper than anyone else will bother to, because
the category looks too small and too operational to attack — until it isn't.

## 6. Team and ask framing

Solo founder at pre-seed, operating the marketplace personally by design (D-001):
founder-sold demand, hand-curated supply, concierge fulfillment behind polished
software. The software already standardizes booking, payment holds, proof, and
payouts (state machines D-015; payments D-013) so that hiring converts directly into
throughput rather than process invention.

Framing of the ask (amounts and instrument live in the financial docs, not here):
fund ~12 months to run the Denver playbook to the seed gates in §7 — founder
survival, legal review (money transmission A-13, gambling adjacency A-15, trademark
D-002), a refund reserve (A-09), stunt/production budget (D-017), and first
contractor hours for concierge ops. What the money is **not** for: paid user
acquisition, multi-city expansion, or automated matching — all explicitly premature
(D-001, D-018, PRD non-goals).

## 7. Milestones to seed

A seed round is earned by evidence, not narrative. Targets — not projections (D-020):

| Gate | Metric | Why it matters |
|---|---|---|
| G1 | ≥ $25k/month GMV run-rate with positive contribution per campaign | The model works at all (validates A-01, A-07) |
| G2 | ≥ 40% repeat buyer rate (and agency repeat ≥ DTC repeat, testing A-02) | Demand is a habit, not a stunt |
| G3 | 3 cities live, each passing the launch gates in `20-city-expansion.md` | The playbook transfers (D-018 sequence: Denver → Austin → Miami) |
| G4 | ≥ 100 completed campaigns with proof; dispute rate ≤ 3% | Ops quality at volume; the moat containers are filling |
| G5 | Self-serve unlocked per D-001 (≥10 completed, ≥3 repeat buyers — expected far earlier) with concierge hours/campaign trending ≤ 4 | Software is absorbing the labor |

Interim proof for the pre-seed check itself: the D-010 30-day goal plus one public
case study from a launch stunt (D-017).

## 8. Risks — stated plainly

Mirrors the risk register; assumption IDs from `ASSUMPTIONS.md`.

| Risk | Exposure | Mitigation / tripwire |
|---|---|---|
| Willingness to pay doesn't materialize (A-01) | Fatal | 100 qualified outbound in 30 days; kill gate in `23-kill-pivot-continue-criteria.md` |
| Concierge labor doesn't compress (A-07) | Margin death by a thousand hours | Time-track every campaign; > 10 hrs with no trend = pivot to pure studio model |
| Venue/permit friction (A-06, A-16) | Kills the most photogenic inventory | Track approval rates from day one; fallback listings (`25-launch-runbook.md`) |
| Regulatory: money transmission (A-13), gambling adjacency (A-15), FTC (A-14) | Structural | Counsel review pre-launch (`LEGAL-REVIEW-QUESTIONS.md`); no-stake fee structures; disclosure enforced in product |
| Refund/chargeback rate exceeds reserve (A-09) | Cash | 5% GMV reserve, monthly consumption tripwire at 80% |
| Founder dependency | Everything is one person | Runbook-driven ops (`25-launch-runbook.md`), documented playbooks, admin tooling as P0 |
| Platform risk on distribution (social channels for stunt content) | Growth variance | Owned case-study pages; email; direct agency relationships |
| Copycats after the first viral stunt | Moderate — category attention cuts both ways | Speed through the moat containers (§5); supply lock-in via reliability history |

## 9. What we will NOT claim to investors

Per D-020, and because credibility is the brand:

1. No market-size figure presented as fact — only labeled comparable-market
   reasoning with methodology.
2. No testimonials, case studies, or campaign results until they exist; the D-008
   poker economics are a **model of a real listing**, not results.
3. No "validated demand" language until ≥ 2 paid campaigns exist (per A-01's own
   falsification bar). As of this writing: zero interviews completed, zero
   transactions — stated in `ASSUMPTIONS.md` and repeated here.
4. No audience/impression estimates without an evidence field ("no estimate
   provided" is the honest default).
5. No claim that the tech is proprietary or hard to replicate today — the moat is
   the operating data we accumulate, not the MVP codebase.
6. No hockey-stick revenue projections; scenarios in `21-financial-scenarios.md` are
   labeled models with stated assumptions.
7. No implication that legal questions (money transmission, gambling adjacency,
   trademark/domain) are resolved — they are open and listed in
   `LEGAL-REVIEW-QUESTIONS.md`.

If that costs us investors who need inflated certainty, that is selection working as
intended — the same honesty is what buyers, sellers, and regulators will get.

## Open questions

1. Pre-seed instrument and amount — finalize against the burn model in
   `21-financial-scenarios.md` before first partner meeting.
2. Do we show the poker listing live in the pitch (real product, real prices) or
   after? Current stance: show it, labeled exactly as what it is.
3. Which of G1–G5 do lead investors weight most in this category — validate the gate
   framing in the first five investor conversations and revise.
