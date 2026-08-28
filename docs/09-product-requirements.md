# 09 · Product Requirements — Transactional MVP

Owner: Product. Conforms to `DECISIONS.md` (D-001, D-005, D-007, D-008, D-011–D-016,
D-020). Marketplace mechanics: `08-marketplace-design.md`. State machine contract:
`10-user-flows.md`. Architecture: `14-technical-architecture.md`.

The product is the software front end of a **managed marketplace** (D-001). That is why
this PRD is unusual in one way, stated plainly:

> **Admin/concierge tooling is P0.** The marketplace is operationally managed — a human
> operator matches briefs, moderates listings, tracks venue approvals and permits,
> releases payouts, and resolves disputes. If the admin surface ships late, the
> business cannot transact at all. Admin features carry the same Must-priority as
> checkout.

---

## 1. Goals

1. A buyer can go from brief (or direct package booking) to paid, proof-backed,
   completed campaign entirely through the app, with concierge work happening in
   admin screens rather than spreadsheets.
2. Money flow modeled correctly end-to-end: authorize → capture → hold → manual
   payout release after proof acceptance → refunds (full/partial), on the
   PaymentProvider abstraction with the mock Stripe-Connect adapter (D-013).
3. Every listing and campaign moves through the exact D-015 state machines, encoded
   in `src/lib/state-machines.ts` and unit-tested.
4. Trust & safety enforced in-product: moderation queue, venue-approval + permit
   tracking, disclosure requirements, timestamped proof before payout (D-016).
5. Runs locally with zero external credentials (SQLite, mock payments, D-012/D-013);
   deployable to Vercel + Supabase without a rewrite.

## 2. Non-goals (explicit)

| Non-goal | Rationale |
|---|---|
| Auctions | Deferred by D-007; flag stub only |
| Subscriptions / brand plans | Deferred by D-007 |
| Native mobile apps | Responsive web only |
| Automated matching / recommendations | Matching is a manual admin workflow (D-001); automation waits for data |
| Real-time chat | Structured offer cards + async threads only (see `08-marketplace-design.md` F3) |
| Multi-city | Denver only (D-003); city field exists in schema but UI is Denver-locked |
| Open self-serve seller onboarding without review | All listings pass moderation |
| Public API, white-label, agency seats | Post-MVP flags (§7) |

## 3. Personas

| Persona | Description | Cares about | Success moment |
|---|---|---|---|
| **Buyer — marketer** ("agency or DTC marketer," D-004) | Runs brand/social campaigns; budget authority $750–$5k; skeptical of novel channels | Clear deliverables, brand safety, proof they can show a client/CMO, no legal surprises | Receives a proof package good enough to reuse in their own content |
| **Seller — individual** (poker player, dog walker, cyclist, small venue) | Has a sponsorable moment, no sponsorship experience | Getting paid reliably, clear expectations, not feeling like gig-work | Payout lands after first completed campaign |
| **Admin — concierge operator** (founder at launch) | Runs the entire marketplace day-to-day | Queue visibility, one-click state transitions with guardrails, audit trail, never losing track of money or permits | Clears all queues daily in < 2 hours |

## 4. Requirements — MoSCoW by surface

Priorities: **M** = Must (MVP blocks without it), **S** = Should (ship in MVP if timeline
holds), **C** = Could (first fast-follow), **W** = Won't (this phase; see §2/§7).

### 4.1 Public surface

| ID | Requirement | Priority |
|---|---|---|
| P-1 | Home page: hero, both CTAs ("Find something to sponsor" / "List something sponsorable"), featured listings, how-it-works strip | M |
| P-2 | Browse: category + price filters, listing cards (per `12-design-system.md` anatomy) | M |
| P-3 | Listing detail: packages with tier pricing, deliverables, constraints, proof commitment, trust badges, disclosure note | M |
| P-4 | Seller profile: bio, listings, completed-campaign count, reviews (rules in `08-marketplace-design.md` §5) | M |
| P-5 | Post-a-brief flow (fields per `08-marketplace-design.md` F2) | M |
| P-6 | List-something flow (pre-auth capture of listing intent → seller onboarding) | M |
| P-7 | How-it-works, pricing (fee transparency incl. D-005 numbers), trust-safety pages | M |
| P-8 | FAQ, about, contact, legal placeholders — placeholders explicitly labeled "draft — pending counsel" (D-020) | M |
| P-9 | Social-share card auto-generation per listing (spec in `12-design-system.md` §8) | S |
| P-10 | SEO/meta baseline per page | S |

### 4.2 Buyer dashboard

| ID | Requirement | Priority |
|---|---|---|
| B-1 | My briefs list + brief detail with status (D-015 campaign states) | M |
| B-2 | Proposals view: compare 2–5 proposals, concierge note, accept/decline with reason | M |
| B-3 | Checkout: package or accepted proposal → order summary with 5% buyer fee line item → mock payment authorization | M |
| B-4 | Campaign tracker: timeline of state changes, next action, dates, deliverables checklist (read-only mirror of seller checklist) | M |
| B-5 | Proof review: view proof package → Accept or Request revision (with structured reason) | M |
| B-6 | Dispute: open dispute from post-payment states, describe issue, see resolution status | M |
| B-7 | Reviews: leave two-sided review at `COMPLETED` | M |
| B-8 | Receipts/invoices per payment | S |
| B-9 | Saved listings / shortlist | C |

### 4.3 Seller dashboard

| ID | Requirement | Priority |
|---|---|---|
| S-1 | Listing builder: multi-step (basics, packages, deliverables, constraints incl. venue-approval flag, availability, media), price floor $250 enforced, "you receive 80%" always visible | M |
| S-2 | Listing status view mirroring D-015 listing states, with moderation feedback on `CHANGES_REQUESTED` | M |
| S-3 | Booking requests: confirm/decline within 48h SLA, calendar conflicts flagged | M |
| S-4 | Campaign checklist: per-campaign deliverables with disclosure step (D-016) as a required, non-skippable item | M |
| S-5 | Proof upload: photos/video/links + timestamp metadata capture; maps to proof spec in `12-design-system.md` §7 | M |
| S-6 | Earnings & payouts: pending (held) vs. released vs. paid; per-campaign math showing 80% share (D-005) | M |
| S-7 | Reliability panel: score inputs shown to the seller (`08-marketplace-design.md` §5) | S |
| S-8 | Availability calendar management | S |
| S-9 | Structured offer cards (respond/counter) | S |

### 4.4 Admin (concierge) surface — P0 per §0

| ID | Requirement | Priority |
|---|---|---|
| A-1 | Moderation queue: listing review, approve / request changes / reject with written reason; T&S checklist per D-016 | M |
| A-2 | Brief triage + matching workbench: candidate listings scored on the five criteria in `08-marketplace-design.md` §3; assemble and send proposals | M |
| A-3 | Venue-approval + permit tracker: per-campaign records (venue, contact, status, dates, documents), blocking flag that prevents `BOOKED → PRE_PRODUCTION` advance until cleared when required | M |
| A-4 | Payments console: authorizations, captures, holds; **manual payout release** button gated on `ACCEPTED` state (D-013) | M |
| A-5 | Refunds: full/partial per the cancellation matrix (`08-marketplace-design.md` §6), with override + reason | M |
| A-6 | Dispute workbench: evidence from both sides, resolution actions (release / partial refund / full refund) | M |
| A-7 | Campaign state controls: advance/rollback transitions the machine allows, never free-form state edits | M |
| A-8 | Audit log: every admin action (who, what, when, before/after) — immutable, filterable | M |
| A-9 | Analytics: the metric set from `08-marketplace-design.md` §7 + D-009 (contribution, cash collected, repeat rate) | S |
| A-10 | User management: role assignment, seller suspension | S |
| A-11 | Ops time-tracking per campaign (tests A-07) | S |

### 4.5 Platform / cross-cutting

| ID | Requirement | Priority |
|---|---|---|
| X-1 | Auth: email+password, scrypt, HMAC-signed HTTP-only session cookies, server-side RBAC on every route handler and server action (D-014) | M |
| X-2 | State machines in one module, unit-tested, matching `10-user-flows.md` exactly (D-015) | M |
| X-3 | PaymentProvider interface + mock Stripe-Connect adapter with idempotent webhook-style events (D-013) | M |
| X-4 | Notifications: in-app + email-stub records for every transition listed in `10-user-flows.md` | M |
| X-5 | Seed script: demo users per role + D-008 poker listing with exact tier pricing; all demo content labeled demo (D-020) | M |
| X-6 | Empty/loading/error states on every surface per `12-design-system.md` §6 | M |
| X-7 | Accessibility per `12-design-system.md` §9 (WCAG 2.1 AA) | M |
| X-8 | Vitest unit + Playwright e2e covering the two golden paths (flows A and B in `10-user-flows.md`) (D-011) | M |

## 5. Major features — stories, acceptance criteria, edge cases

### 5.1 Post a brief (P-5, B-1, B-2)

**Story:** As a buyer marketer, I post what I want and my budget, so the concierge
finds me real options without me learning a new inventory category.

**Acceptance criteria**
- Submitting a valid brief creates a campaign in `BRIEF_SUBMITTED`; buyer sees it in
  the dashboard immediately with an honest status ("A human reviews every brief within
  1 business day").
- Budget input rejects max < $250; guidance text shows the $750–$5,000 target band.
- Admin triage moves it to `MATCHING`; buyer is notified.
- Proposals appear only when admin publishes them (`PROPOSALS_AVAILABLE`); each shows
  price incl. buyer fee, deliverables, proof commitment, concierge note.
- Accepting a proposal moves to `OFFER_PENDING` and routes to checkout; declining all
  proposals returns the brief to `MATCHING` with the decline reasons logged.

**Edge cases:** brief submitted for a non-Denver location → blocked with waitlist
capture; brief budget below any plausible package → triage rejects with a courteous
explanation; buyer abandons at checkout → offer expires after 7 days back to
`PROPOSALS_AVAILABLE`; no supply found → admin marks unfillable at day 5, buyer
notified honestly.

### 5.2 Direct package checkout (B-3)

**Story:** As a buyer, I book a fixed package and pay in one sitting, so booking feels
as safe as any e-commerce purchase.

**Acceptance criteria**
- Order summary shows package price, buyer service fee (5%), and total — using D-005
  math exactly (e.g., $750 package → $787.50 total).
- Successful mock authorization creates the campaign in `PAYMENT_AUTHORIZED`; funds
  show as authorized, not captured.
- Seller gets a booking request; confirm → capture + `BOOKED`; decline or 48h timeout
  → auth voided, buyer notified with alternatives.
- Listing flips to `BOOKED` when its bookable window is exclusively committed.

**Edge cases:** payment authorization failure → campaign not created, cart preserved;
double-submit → idempotency key prevents duplicate campaigns; package edited by
seller between page load and checkout → price revalidated server-side, buyer sees a
"listing changed" interstitial; venue-approval-required package → checkout shows the
D-008-style constraint and the no-fault refund rule.

### 5.3 Listing builder + moderation (S-1, S-2, A-1)

**Story:** As a seller, I build a listing with packages and know exactly where it is in
review; as the admin, I approve nothing that fails T&S.

**Acceptance criteria**
- Draft persists at every step; submit moves `DRAFT → SUBMITTED`.
- Admin opening it moves `SUBMITTED → UNDER_REVIEW`; approve → `APPROVED` then
  `LIVE` on publish; request changes → `CHANGES_REQUESTED` with written feedback
  visible to the seller; resubmit returns it to `SUBMITTED`. Reject → `REJECTED`
  (terminal) with reason.
- Prices below $250 cannot be saved; every price shows the 80% seller share.
- Venue-approval-required flag forces a venue section (name, contact, status).
- Prohibited-category screen (per `13-trust-safety-and-compliance.md`) runs at submit;
  hits route to human review, never auto-approval (D-016).

**Edge cases:** seller edits a `LIVE` listing → material edits (price, deliverables,
constraints) send it back through `SUBMITTED` review while the prior version stays
live-but-locked; seller pauses (`LIVE ⇄ PAUSED`) with an active booking → existing
campaign unaffected, new bookings blocked; listing with zero media → allowed at
submit, flagged by moderator as changes-requested with photo guidance.

### 5.4 Proof upload and review (S-5, B-5)

**Story:** As a seller I submit timestamped proof; as a buyer I accept it or request a
revision — because payout depends on it, the flow must be unambiguous.

**Acceptance criteria**
- Proof upload allowed only in `IN_PROGRESS`; submitting moves to `PROOF_SUBMITTED`
  then `BUYER_REVIEW` when the buyer is notified.
- Proof package requires: ≥1 media item, capture timestamp (metadata or manual
  attestation, distinguished honestly), deliverables checklist mapped item-by-item,
  disclosure evidence (screenshot/photo showing #ad or signage) per D-016.
- Buyer Accept → `ACCEPTED`; payout becomes releasable in admin (A-4). Request
  revision → `REVISION_REQUESTED` with a structured reason (missing item / quality /
  wrong deliverable / disclosure missing) → seller resubmits → `PROOF_SUBMITTED`.
- Max 2 revision cycles before the campaign auto-escalates to admin (dispute-adjacent
  triage) — prevents infinite loops.
- Buyer inaction for 7 days in `BUYER_REVIEW` → auto-accept warning at day 5, then
  auto-`ACCEPTED` at day 7 (stated at checkout; protects sellers).

**Edge cases:** proof file too large / wrong type → client + server validation with
actionable error; timestamp metadata absent → manual attestation path labeled as
attested-not-verified (D-020); buyer requests revision outside the structured reasons →
must pick nearest category + free text.

### 5.5 Payout release, refunds, disputes (A-4, A-5, A-6, B-6)

**Story:** As the admin, I release money only after acceptance, and I can resolve
disputes with full/partial refunds — with every action logged.

**Acceptance criteria**
- Payout release button enabled only in `ACCEPTED`; releasing moves to
  `PAYOUT_RELEASED` (then `COMPLETED` when both post-completion tasks — payout paid
  event received and proof archived — are done). Amount = 80% of package price
  (D-005), shown with full math.
- Buyer can open a dispute from any post-payment state; campaign moves to
  `DISPUTED`; payout release is blocked while disputed.
- Admin resolution actions: release payout (dispute rejected), partial refund
  (amounts per cancellation matrix or custom-with-reason), full refund → `REFUNDED`.
- Every money action writes an audit-log entry and a payment-provider event; replayed
  webhook events are idempotent (D-013).

**Edge cases:** dispute opened after payout released → flagged "post-payout dispute,"
resolution limited to goodwill refund from platform funds (policy note in admin);
partial refund exceeding captured amount → blocked server-side; refund on a voided
auth → no-op with explanation.

### 5.6 Venue approval & permit tracking (A-3)

**Story:** As the admin, I track venue approvals and permits per campaign so nothing
gets branded where it isn't allowed (D-016, D-008 constraint, tests A-06/A-16).

**Acceptance criteria**
- Campaigns on venue-flagged listings show a blocking "Venue approval" task; the
  machine refuses `APPROVAL_PENDING → IN_PROGRESS` until it is marked Approved.
- Record fields: venue, contact, request date, status
  (pending/approved/denied/expired), documents, notes.
- Denied → admin triggers the no-fault cancellation path (100% refund).
- Approval outcomes are queryable (feeds the A-06 assumption test).

**Edge cases:** approval expires before execution date → task reopens and blocks;
permit cost exceeds estimate → logged against A-16.

## 6. Cross-feature acceptance floor

Every Must feature also satisfies: server-side RBAC (D-014), all state changes via the
shared machine module (D-015), no fabricated data in any copy or fixture (D-020), all
demo content labeled, empty/loading/error states present, and AA accessibility
(`12-design-system.md` §9).

## 7. Feature flags (post-MVP)

All default **off**; flags exist so post-MVP work doesn't fork the codebase.

| Flag | Unlocks | Gate to consider turning on |
|---|---|---|
| `auctions_enabled` | Auction format (F4) | Scarce inventory + proven multi-buyer demand (D-007) |
| `subscriptions_enabled` | Brand/agency monthly plans | ≥3 repeat buyers (D-007) |
| `agency_accounts_enabled` | Multi-seat agency workspaces, client sub-accounts | ≥2 agencies with ≥3 campaigns each |
| `white_label_enabled` | Agency-branded proof reports & share pages | Pulled by a paying agency |
| `self_serve_matching` | Buyer-visible search-to-book without concierge proposals | ≥10 completed campaigns + ≥3 repeat buyers (D-001) |
| `multi_city_enabled` | Non-Denver listings/briefs | City gates in `20-city-expansion.md` (D-018) |

## Open questions

1. Auto-accept at day 7 of `BUYER_REVIEW` (§5.4): right protection for sellers, or too
   aggressive for agency buyers with client-approval delays? Consider 10 business days
   for brief-originated campaigns.
2. Do receipts/invoices (B-8) need to be PDF for agency finance teams in MVP, or is a
   printable page enough for the first 10 campaigns?
3. Email delivery: MVP writes email-stub records (X-4); pick the real provider at
   deploy time — needs a decision before launch week (`25-launch-runbook.md`
   pre-launch checklist).
4. Should admin campaign-state rollback (A-7) be limited to one step back, or any
   machine-legal reverse edge? Current stance: only machine-legal edges, both noted in
   `10-user-flows.md`.
