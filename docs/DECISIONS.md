# DECISIONS.md — Canonical Decision Log

This file is the single source of truth for strategic, economic, product, and technical
decisions. Every other document and the application code must agree with the numbers and
decisions recorded here. When a decision changes, change it here first.

Status legend: **DECIDED** (build against it) · **PROVISIONAL** (build against it, revisit at a
named checkpoint) · **DEFERRED** (do not build yet).

---

## D-001 · Company posture: managed marketplace first — DECIDED

SponsorThis launches as a **managed marketplace and activation studio**, not an open
two-sided marketplace. Supply is hand-curated, demand is founder-sold, and the first
campaigns are operated manually with software standardizing booking, payment,
deliverables, proof, and reporting. Self-service unlocks only after ≥10 completed paid
campaigns and ≥3 repeat buyers.

**Why:** cold-start liquidity kills open marketplaces in novel categories; a managed motion
collects cash in weeks, produces case studies, and generates the pricing data that later
powers self-serve.

## D-002 · Working name stays "SponsorThis" — PROVISIONAL

Naming review (see `11-brand-strategy.md`) keeps **SponsorThis** for launch: it is
category-defining, verb-like, memorable, and self-explanatory. Domain/trademark
availability could not be fully verified from this environment and is flagged in
`LEGAL-REVIEW-QUESTIONS.md`. Fallback candidates and scoring live in the brand doc.
Tagline: **"Make anything sponsorable."** Secondary line: "Real people. Real moments.
Real-world attention."

## D-003 · Launch wedge: verified sponsorable moments in Denver — DECIDED

First category: **verified sponsorable moments** (people, events, vehicles, spaces,
challenges, permitted activations) sold as fixed packages with defined deliverables and
timestamped proof. First city: **Denver**. No second city until Denver clears the city-launch
criteria in `20-city-expansion.md`.

## D-004 · Initial buyer focus — DECIDED

Priority order for outbound: (1) **marketing/creative agencies** (highest expected repeat
value), (2) **consumer startups & DTC brands** (highest appetite for shareable, unusual
campaigns), (3) **local Denver businesses** (fastest to close, lower LTV — used to prove the
motion and feed case studies). Everything else is opportunistic until $10k GMV.

## D-005 · Fee structure (self-serve bookings) — DECIDED

- Platform fee: **20% deducted from seller payout**
- Buyer service fee: **5% added at checkout**
- Payment processing (modeled at 2.9% + $0.30 on the charged amount) absorbed by the
  platform out of its margin
- **Minimum transaction: $250 package price**
- Target initial order value: **$750–$5,000**
- Sellers are never charged to create a listing during launch

Worked example — a $750 package: buyer pays $787.50, seller receives $600.00, platform
gross take $187.50, processing ≈ $23.14, payout fee ≈ $1.75 → platform net ≈ $162.61
before labor.

## D-006 · Managed campaign pricing — DECIDED

All-in campaign pricing targeting **35–50% gross margin** before fixed overhead.
**Minimum campaign fee: $1,500.** Production, permits, insurance, merch, staffing, and
travel quoted as pass-through line items with a 15% coordination markup. Rush fee: +20%
for < 10 business days lead time.

## D-007 · Subscriptions and auctions — DEFERRED

Brand/agency monthly plans ($299–$499) and auctions are **not** in the MVP. Revisit plans
after 3 repeat buyers exist; revisit auctions only for scarce inventory with proven demand.

## D-008 · Seed listing: "Sponsor Aaron at a $200 Denver poker tournament" — DECIDED

Three packages (pricing anchors for all example economics):

| Tier | Price | Buyer pays (+5%) | Seller payout (80%) | Platform gross | Est. processing | Est. labor | Est. contribution |
|---|---|---|---|---|---|---|---|
| 1. Basic placement | $450 | $472.50 | $360.00 | $112.50 | $14.00 | $60 (1.5h) | ≈ $37 |
| 2. Placement + content | $750 | $787.50 | $600.00 | $187.50 | $23.14 | $80 (2h) | ≈ $83 |
| 3. Exclusive activation | $1,500 | $1,575.00 | $1,200.00 | $375.00 | $45.98 | $160 (4h) | ≈ $166 |

Constraints baked into the listing: venue approval required before branding confirmed; no
guaranteed impressions; no share of winnings; no financial interest in the gambling result;
clear paid-sponsorship disclosure; placement only where casino/tournament permits.
Labor modeled at $40/hr fully-loaded concierge time; payout fee ≈ 0.25% + $0.25.

## D-009 · Primary metrics — DECIDED

Operating metric #1: **contribution margin from completed campaigns**. #2: **repeat buyer
rate**. Cash collected in 30 days ranks above GMV. Signups, listings, and followers are
explicitly not success metrics.

## D-010 · First-30-days revenue goal — DECIDED

**3–5 paid campaigns, ≥ $5,000 cash collected, ≥ $1,500 contribution margin.** Kill/pivot/
continue gates are defined in `23-kill-pivot-continue-criteria.md`.

## D-011 · Tech stack — DECIDED

Next.js (App Router) + TypeScript + React + Tailwind CSS. Prisma ORM. **Vitest** for unit
tests, **Playwright** for e2e, ESLint + Prettier. Deployed target: Vercel.

## D-012 · Local-first database; Supabase as production target — DECIDED

The repo must run locally with zero external credentials, so the MVP uses **Prisma with
SQLite** for local development and demo. The schema is written Postgres-compatible; the
documented production path is **Supabase Postgres** (swap the datasource, run
migrations). Rationale: the Definition of Done requires a working local app; no Supabase
credentials exist in the build environment; Prisma makes the swap a config change, not a
rewrite. See `14-technical-architecture.md`.

## D-013 · Payments: provider abstraction with a mock adapter modeling Stripe Connect — DECIDED

No Stripe keys exist in the build environment, and real money movement requires founder
action (Stripe account, Connect onboarding). The app implements a **PaymentProvider
interface** whose mock adapter models Stripe Connect destination-charge semantics
exactly: `requires_payment → authorized → captured → (partially_)refunded`, payouts
`held → released → paid`, webhook-style idempotent event handling, and manual payout
release from admin. The Stripe adapter slot, env validation, and reconciliation notes are in
`14-technical-architecture.md`. We never describe buyer protection as legal "escrow" —
funds are captured to the platform account and payouts are released after proof
acceptance (pending attorney review of money-transmission exposure, see
`LEGAL-REVIEW-QUESTIONS.md`).

## D-014 · Auth: cookie-session credential auth with server-side RBAC — DECIDED

For the local-first MVP: email + password (scrypt-hashed), HMAC-signed HTTP-only session
cookies, roles `BUYER | SELLER | ADMIN` enforced **server-side** in every route handler and
server action. Production path: swap to Supabase Auth behind the same `getSession()`
seam. No authorization logic lives only in the client.

## D-015 · Campaign & listing state machines — DECIDED

Listing states: `DRAFT → SUBMITTED → UNDER_REVIEW → (CHANGES_REQUESTED ⇄ SUBMITTED) → APPROVED → LIVE ⇄ PAUSED → BOOKED → COMPLETED → ARCHIVED`, plus `REJECTED`.
Campaign states: `BRIEF_SUBMITTED → MATCHING → PROPOSALS_AVAILABLE → OFFER_PENDING → PAYMENT_AUTHORIZED → BOOKED → PRE_PRODUCTION → APPROVAL_PENDING → IN_PROGRESS → PROOF_SUBMITTED → BUYER_REVIEW → (REVISION_REQUESTED ⇄ PROOF_SUBMITTED) → ACCEPTED → PAYOUT_RELEASED → COMPLETED`, with `DISPUTED` and `REFUNDED` reachable from post-payment states. Allowed transitions are encoded in one module
(`src/lib/state-machines.ts`) and unit-tested; the full matrix with permissions and
notifications is in `13`-adjacent doc `10-user-flows.md`.

## D-016 · Trust & safety is launch-blocking, not a later feature — DECIDED

18+ only at launch. Paid-sponsorship disclosure required on all content. Venue approval
and permit tracking are first-class listing fields and admin queues. Prohibited-categories
policy (see `13-trust-safety-and-compliance.md`) is enforced at listing moderation; novel
activations always get human review. Timestamped proof required before payout release.

## D-017 · Launch stunt engine — DECIDED

30 concepts scored in `19-launch-stunts.md`. Top three selected: (1) the poker-tournament
sponsorship (flagship, doubles as seed listing), (2) "Sponsor a Denver dog-walking day" —
permitted, wholesome, high content output, (3) "100 branded bike commutes" — a
citywide sequence of small branded moments sold as one package. At least one stunt
must convert into a public case study in the first 60 days.

## D-018 · City expansion sequence — PROVISIONAL

Denver → Austin → Miami → New York → Los Angeles → Chicago → Las Vegas, with Las
Vegas deliberately last among the seven (heaviest venue restrictions for casino-adjacent
inventory) — full criteria and challenge analysis in `20-city-expansion.md`. No city opens
without meeting the supply/demand/ops gates defined there.

## D-019 · Repository layout — DECIDED

`/docs` (strategy), `/data` (CSV models/templates), `/app` (Next.js application),
`/kalshi-prototype` (pre-existing, unrelated, left untouched).

## D-020 · Honesty constraints on all artifacts — DECIDED

No fabricated market sizes, interviews, testimonials, or campaign results anywhere in the
repo. Estimates are labeled as estimates with methodology. Sample/demo data is labeled
as demo data. Audience numbers in listings must carry an evidence field or say "no
estimate provided."
