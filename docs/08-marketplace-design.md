# 08 · Marketplace Design — Mechanics, Liquidity, Matching, Reputation

Owner: Product. Conforms to `DECISIONS.md` (D-001, D-005, D-007, D-008, D-009, D-015,
D-016, D-020). State names below are the canonical D-015 names; the full transition
contract lives in `10-user-flows.md`.

SponsorThis is a **managed marketplace**: every mechanism in this document is designed
to be operated by a human concierge (admin role) behind polished software first, and
automated only after the manual version has produced ≥10 completed paid campaigns
(D-001).

---

## 1. Transaction formats

Four formats, two live at launch, one live-but-structured, one deferred.

| # | Format | Status at launch | Primary side initiating | Typical AOV |
|---|---|---|---|---|
| F1 | Fixed packages | **Live** | Buyer books directly | $250–$1,500 |
| F2 | Buyer briefs | **Live — primary early demand flow** | Buyer posts, admin matches | $750–$5,000 |
| F3 | Custom offers via structured messaging | Live, admin-mediated | Either side | $500–$5,000 |
| F4 | Auctions | **Deferred (D-007)** | — | — |

### F1 · Fixed packages

A listing carries 1–3 packages, each with a fixed price (≥ $250 per D-005), a defined
deliverables list, a proof commitment, and constraints (e.g., "venue approval required
before branding is confirmed" on the poker listing, D-008). The buyer checks out
directly; payment is authorized at checkout; the campaign enters the D-015 machine at
`PAYMENT_AUTHORIZED`.

Why packages: they make novel inventory legible. A buyer who has never sponsored a
poker player can still compare "$450 basic placement" vs. "$1,500 exclusive activation"
the way they compare hotel rooms. The D-008 tiers ($450 / $750 / $1,500) are the
canonical template every seller listing is coached toward: **good / better / exclusive**,
with deliverables and proof escalating at each tier.

Flow summary (full detail in `10-user-flows.md` flow B):

1. Buyer opens listing → selects package → checkout (price + 5% buyer fee shown as a
   line item).
2. Payment authorized (not captured until booking confirms; mock provider models
   Stripe Connect semantics per D-013).
3. Seller confirms availability within 48h → `BOOKED`; otherwise auth is voided and the
   buyer is notified with alternatives.
4. Execution → proof → buyer acceptance → payout released (20% platform fee deducted
   from the seller side, D-005).

### F2 · Buyer briefs — the primary early demand flow

Most early buyers do not know what inventory exists; they know their goal ("we want
something weird and real in Denver for our March launch, $3k"). The brief flow captures
that and lets the concierge do the work.

Brief fields (all required unless noted):

| Field | Notes |
|---|---|
| Objective | Free text + picklist (awareness / content capture / local presence / launch stunt) |
| Budget range | Min/max; must overlap ≥ $250; guidance text anchors $750–$5,000 (D-005) |
| Target dates / flexibility | Date range + hard-deadline flag |
| Location | Denver-only at launch; ZIP or neighborhood optional |
| Brand-safety constraints | Prohibited contexts picklist + free text (alcohol-adjacent, gambling-adjacent, etc.) |
| Deliverable preferences | Photos / video / social posts / physical placement / event presence |
| Company + contact | Verified at proposal stage |

Flow summary (full detail in `10-user-flows.md` flow A): brief submitted →
`BRIEF_SUBMITTED` → admin triage within 1 business day → `MATCHING` → admin
assembles 2–5 proposals (existing listings, adapted listings, or newly recruited supply)
→ `PROPOSALS_AVAILABLE` → buyer accepts one → `OFFER_PENDING` → payment
authorized → `BOOKED` → execution machine.

**Why briefs lead:** demand-led matching means we only recruit supply we can sell,
which is the only affordable liquidity strategy at zero volume (see §2).

### F3 · Custom offers via structured messaging

Free-form chat is a non-goal (see `09-product-requirements.md`). Instead, negotiation
happens through **structured offer cards** attached to a thread on a listing or brief:

- An offer card = price, deliverables list, dates, proof commitment, expiry (default 7
  days).
- Either side can counter by issuing a new card; prior cards are marked superseded.
- Accepting a card creates a bookable package priced exactly as the card states, and
  the flow rejoins F1 at checkout.
- At launch every custom offer passes through admin review before the counterparty
  sees it (pricing sanity, T&S screen per D-016, disclosure language present).

This gives us negotiation without unmoderated chat, and every accepted card becomes
a **pricing benchmark datapoint** (see `24-investor-narrative.md` on the data moat).

### F4 · Auctions — deferred

Per D-007: revisit only for provably scarce inventory with proven demand (e.g., a
one-of-one moment with multiple competing buyers). Behind feature flag
`auctions_enabled` (see `09-product-requirements.md` §7). No auction UI, schema, or
copy ships in the MVP beyond the flag stub.

---

## 2. Liquidity strategy

The cold-start plan is **curation + demand-led matching + concentration**, not open
signup.

1. **Curated supply.** Target 25–50 hand-recruited Denver listings in the first 30 days
   (tests A-05). Every listing passes human moderation (D-015 listing states,
   D-016 T&S). We would rather have 30 bookable listings than 300 dead ones — an
   unbookable listing is negative liquidity because it burns buyer trust.
2. **Demand-led matching.** The brief flow (F2) is promoted above browse on the
   homepage during launch. Supply recruitment is steered by open briefs: if three
   briefs ask for fitness-adjacent moments, the concierge recruits runners and gyms
   next, not more poker players.
3. **Concentration.** One city (Denver, D-003) and a shortlist of launch categories:
   sponsored people/moments (poker, dog-walking day, bike commutes per D-017),
   small event presence, vehicles/objects, and permitted micro-activations. Depth in
   few categories beats breadth; fill rate is measured per category (§7).
4. **Seed inventory honesty.** Founder-operated seed listings (starting with the D-008
   poker listing) are real, bookable, and clearly attributed — never fake accounts. Demo
   data in the app is labeled as demo (D-020).

**What we deliberately do not do at launch:** paid supply acquisition, open seller
signup without review, multi-city listings, or any "browse thousands of options"
claims.

---

## 3. Matching workflow (manual first)

Matching is an **admin queue**, not an algorithm (automated matching is an explicit
non-goal in `09-product-requirements.md`). The admin matching screen scores each
candidate listing against a brief on five criteria, in priority order:

| Priority | Criterion | Pass rule | Hard filter? |
|---|---|---|---|
| 1 | Brand-safety fit | No conflict with buyer's prohibited contexts; passes D-016 policy | **Yes** |
| 2 | Budget fit | A package (or plausible custom offer) fits within brief budget incl. 5% buyer fee | **Yes** |
| 3 | Date fit | Seller available in the brief window; venue/permit lead time achievable | **Yes** |
| 4 | Category fit | Matches objective + deliverable preferences | Rank |
| 5 | Seller reliability | Reliability score (§5); new sellers allowed but flagged "new — concierge-backed" | Rank |

Rules of operation:

- 2–5 proposals per brief. One proposal signals no market depth; six signals no point
  of view. Each proposal carries a concierge note: why this match, what's negotiable,
  what proof the buyer will get.
- If nothing in the catalog passes the hard filters, the admin recruits supply against
  the brief before responding — the buyer is told "we're sourcing options" (honest
  status, D-020), with a 5-business-day cap before we say we can't fill it.
- Every proposal decision (sent, accepted, declined + reason) is logged; declined
  reasons feed pricing guidance (§4) and recruitment priorities.
- Target service levels: triage < 1 business day, proposals < 3 business days,
  brief→booked < 10 business days.

---

## 4. Pricing guidance for sellers

We have no transaction history yet, so guidance is **anchored, honest, and
concierge-reviewed** rather than algorithmic:

1. **Anchor table in the listing builder.** The D-008 poker tiers ($450 / $750 / $1,500)
   are shown as a labeled worked example ("example seed listing — not a market
   average," per D-020), alongside the take-rate math: list price → seller receives 80%.
   The builder always displays "You receive $X" next to every price field.
2. **Floor enforcement.** Prices below $250 are blocked at the form level (D-005).
   Prices below $400 trigger a soft warning: below ~$400, concierge labor makes the
   transaction contribution-negative at launch (see D-008 labor math).
3. **Three-tier coaching.** The builder nudges sellers toward good/better/exclusive
   tiers with escalating deliverables and proof. Single-package listings are allowed.
4. **Admin price review at moderation.** Moderators flag prices that are implausibly
   high (buyer-trust risk) or low (seller-regret and margin risk) via
   `CHANGES_REQUESTED` with a written rationale.
5. **Benchmarks later.** Once ≥20 completed campaigns exist per category, replace
   anchors with real quartile ranges from accepted offers and completed bookings.
   Until then the UI must not imply market data exists (D-020).

---

## 5. Reviews and reputation

### Two-sided reviews

- Reviews unlock only at campaign `COMPLETED` (D-015) — no reviews without a real
  transaction, which structurally prevents fabricated testimonials (D-020).
- Double-blind window: 14 days; a review publishes when both sides submit or the
  window closes, whichever is first.
- Buyer reviews seller: 1–5 stars overall + structured facets (deliverables as promised,
  communication, proof quality) + text. Seller reviews buyer: 1–5 stars + facets
  (clarity of brief, responsiveness, payment/scope conduct).
- Disputed campaigns: reviews are held until dispute resolution; resolved-dispute
  campaigns may be reviewed, with an admin-visible "resolved dispute" marker.
- Public display: on listings and seller profiles, review counts and text. No aggregate
  star average is displayed until a seller has ≥3 reviews (below that, small-n averages
  mislead; show "New seller · 1 completed campaign" instead).

### Seller reliability score

Internal 0–100 score used for matching rank (§3) and admin risk flags. Shown to
sellers on their dashboard with its inputs; shown to buyers only as tier badges
(New / Reliable / Top) once thresholds are earned, never as a raw number at launch.

| Input | Weight | Definition | Source of truth |
|---|---|---|---|
| Completion rate | 35% | Completed ÷ (booked − buyer-fault cancellations) | Campaign states |
| On-time proof | 25% | Proof submitted by the deliverable deadline | `PROOF_SUBMITTED` timestamps |
| Response time | 20% | Median time to respond to booking requests / offer cards (48h SLA) | Messaging events |
| Revision rate | 20% | Campaigns with ≥1 `REVISION_REQUESTED` ÷ completed | Campaign states |

Rules: new sellers start unscored (not zero) and are matched with a concierge-backed
flag; scores are recomputed on every campaign close; seller-fault cancellations apply
the penalties in §6. Reliability history is a compounding moat asset — it cannot be
scraped or bought (see `24-investor-narrative.md`).

---

## 6. Cancellation policy matrix

"Days" = days before the scheduled execution date. Refund % applies to the full amount
the buyer paid (package price + 5% buyer fee) — processing costs are absorbed by the
platform per D-005. Admin can override any cell with a logged reason (managed
marketplace; audit-logged per the admin spec in `09-product-requirements.md`).

| Who cancels | Timing | Buyer refund | Seller payout | Reliability / record impact |
|---|---|---|---|---|
| Buyer | Before seller confirms (auth not captured) | 100% (auth voided) | — | None to either side |
| Buyer | ≥ 14 days out | 100% | $0 | None |
| Buyer | 7–13 days out | 75% | 25% of the package's seller share (compensates reserved time) | Noted on buyer record |
| Buyer | < 7 days out | 50% | 50% of the package's seller share | Noted on buyer record |
| Buyer | < 48 hours / after execution starts | 0% (dispute path only) | Full payout on proof of readiness/execution | Buyer flagged for review |
| Seller | ≥ 14 days out | 100% | $0 | −1 completion event (minor score hit) |
| Seller | 7–13 days out | 100% | $0 | Completion-rate hit + warning |
| Seller | < 7 days out | 100% + concierge re-match priority | $0 | Major score hit; second offense within 90 days → listing `PAUSED` pending review |
| Seller | No-show | 100% | $0 | Listing suspended pending admin review; possible removal |
| Platform (T&S / venue denial / permit failure) | Any time | 100% | $0 (goodwill credit at admin discretion) | No fault recorded to either side |

Venue-approval failure on venue-dependent listings (e.g., D-008 constraint) is always a
platform-initiated, no-fault, 100%-refund cancellation — buyers are told this rule
upfront at checkout.

---

## 7. Fill-rate and liquidity metrics

Per D-009, cash and contribution rank above everything here; these are diagnostic
metrics, not success metrics. All are **targets, not projections** (D-020) — reviewed
weekly against `23-kill-pivot-continue-criteria.md`.

| Metric | Definition | 30-day target | 90-day target |
|---|---|---|---|
| Brief fill rate | Briefs receiving ≥2 qualified proposals ÷ briefs accepted at triage | ≥ 60% | ≥ 75% |
| Brief→booked conversion | Booked campaigns ÷ triaged briefs | ≥ 25% | ≥ 35% |
| Time to first proposal | Median, business days | ≤ 3 | ≤ 2 |
| Brief→booked cycle time | Median, business days | ≤ 10 | ≤ 7 |
| Listing bookability | Live listings with confirmed availability in next 30 days ÷ live listings | ≥ 70% | ≥ 80% |
| Listings booked ≥1× | Share of live listings with ≥1 booking in trailing 90 days | — | ≥ 30% |
| Curated supply count | Live, moderated Denver listings | 25 | 50 (A-05 test) |
| Completion rate | Completed ÷ booked | ≥ 90% | ≥ 92% |
| On-time proof rate | Proof by deadline ÷ completed | ≥ 85% | ≥ 90% |
| Dispute rate | Disputed ÷ booked | ≤ 5% | ≤ 3% (watch A-09 reserve) |
| Repeat buyer rate | Buyers with ≥2 booked campaigns | ≥ 1 buyer | ≥ 25% of buyers |

Category-level rule: any launch category with fill rate < 40% at day 60 is either
re-priced, re-supplied, or cut — concentration (§2) means we prune, not limp.

---

## Open questions

1. Should buyer-cancellation partial payouts (§6, 25%/50% rows) be structured as
   liquidated damages in the seller agreement? Needs counsel — added to
   `LEGAL-REVIEW-QUESTIONS.md` scope.
2. At what completed-campaign count do we let structured offers (F3) flow
   seller↔buyer without pre-send admin review — 10 campaigns (matching D-001's
   self-serve gate) or per-seller trust tiers?
3. Do we surface the buyer-conduct record (§6) to sellers pre-acceptance, or keep it
   admin-only until we have enough volume to calibrate fairness?
4. Double-blind review window of 14 days is a guess; revisit after the first 10
   completed campaigns.
