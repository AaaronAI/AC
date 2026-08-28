# 07 · Concierge Operations Playbook

This manual playbook **is** the early product (D-001). Software (the app's admin) standardizes
it; humans run it. Every campaign flows through the stages below, mapped to the D-015 state
machine. Time budgets must sum to **≤ 8 hours/campaign** now, with a documented path to
**≤ 3 hours** (A-07 gate: ≤ 6h by campaign #10).

Tools at launch: one Google Sheet workbook (tabs: Pipeline, Matching, Ops Log, Payments,
Proof Tracker) + the app's admin queues as they come online + calendar + e-sign tool +
Stripe invoicing (or equivalent; payments abstraction per D-013 — no funds language that
implies legal escrow).

---

## 1. Intake (state: BRIEF_SUBMITTED) — budget 20 min

Buyer submits the brief form or we transcribe a call into it. Required fields:
company, contact + role, objective (awareness / content / launch / local footfall),
audience descriptor, budget band, date window, brand-safety constraints (prohibited
contexts, competitors, tone), disclosure acknowledgment, decision maker, how they heard
of us. Seller intake mirrors it: identity (18+ per D-016), inventory description, location,
dates, audience evidence **or "no estimate provided"** (D-020), venue dependencies, rates
expectations, photo/video capability.

Incomplete brief → one same-day email with the exact missing fields. Two non-responses →
mark stalled, follow-up ladder from doc 06 §3 applies.

## 2. Qualification — budget 20 min

Score against: budget ≥ $250 package minimum / $1,500 managed minimum (D-005/D-006);
timeline ≥ 10 business days (else quote +20% rush per D-006); decision maker identified;
brief passes prohibited-categories policy (D-016 / doc 13); brand-safety constraints
satisfiable by current catalog. Fail → honest decline or waitlist email same day (never
string a buyer along). Pass → state MATCHING.

## 3. Matching (state: MATCHING → PROPOSALS_AVAILABLE) — budget 45 min

Manual workflow, run within 24h of a qualified brief:

1. Filter the catalog sheet by city, date window, category, price band.
2. Shortlist 4–6, cut to **2–3 options** on brand-fit + reliability + proof capability.
3. Ping each shortlisted seller for availability + willingness (template ping; 24h reply window).
4. Log match rationale in the Matching tab (brief_id, listing_ids, fit notes, rejected-because).
   This log is the training data for future automated matching — write it like it matters.

No fit in catalog → tell the buyer honestly, offer a custom-sourcing option (managed
campaign, D-006 pricing), and add the gap to the supply-curation list.

## 4. Proposal (SLA: **first proposal within 48h of qualified brief**) — budget 45 min

Use the doc 18 §7 template. Every proposal states: 2–3 options with fixed package prices
(D-005: buyer pays package + 5% service fee) or managed campaign quote (D-006: ≥ $1,500,
35–50% target gross margin, pass-throughs itemized +15% coordination markup), concrete
deliverables + proof spec, dates, what we do NOT promise (no guaranteed impressions —
D-008 constraint language generalizes), expiry date (7 days), payment terms (§5).
Follow-ups: +2 days, +5 days, then close-out per doc 06 rules.

## 5. Agreement & payment (OFFER_PENDING → PAYMENT_AUTHORIZED → BOOKED) — budget 30 min

- E-sign agreement: deliverables, dates, disclosure requirement (FTC-compliant #ad/#sponsored
  per A-14), cancellation/refund terms, no-gambling-stake language where relevant (A-15),
  content usage rights, revision limits (one revision round on content deliverables).
- **Payment terms (recorded rule, doc 18 §10): package bookings are paid in full at booking;
  managed campaigns are 50% to schedule, 50% due at proof acceptance.** Nothing is
  scheduled, no venue is approached in the buyer's name, until money has moved.
- Invoice via Stripe invoice/payment link. Log in Payments tab: amount, fees per D-005 math,
  expected seller payout (80%), payout hold status.

## 6. Pre-production (PRE_PRODUCTION → APPROVAL_PENDING) — budget 2h

- **Venue approval** (D-016: first-class, launch-blocking where applicable): written OK
  (email counts) from venue naming the sponsor, placement, and date. No visible branding
  without it — this is the D-008 poker constraint applied everywhere.
- **Permits:** check doc 19 permit notes. Denver film/photo permits are free via Public Event
  & Film Permitting; Denver park event permits need ~60-day lead and real fees — route
  around parks for short-lead campaigns (private venues, sidewalks under free-speech/
  ordinary-use thresholds — confirm per activation, log the determination).
- **Creative:** sponsor logo files, placement mockup photo (phone photo with markup is fine),
  buyer sign-off in writing before production. Order merch/printing only after sign-off.
- **Seller prep call (15 min):** run-of-day, deliverables checklist, disclosure script, proof
  spec, backup plan, payment/payout expectations.
- Book the **backup seller** for any campaign > $1,000 (§10).

## 7. Execution day-of runbook (IN_PROGRESS) — budget 1.5h on-site/remote

T-24h: confirm seller, venue, weather call (outdoor), buyer reminded of live window.
T-0 checklist:
1. Seller on-site confirmation (photo of setup before start).
2. Branding placed exactly per approved mockup; disclosure visible/spoken as agreed.
3. Proof capture per standard (below) during, not after.
4. One mid-campaign update to buyer (photo + one line) — cheap delight, high repeat signal (A-10).
5. Teardown photo; venue left clean; thank venue contact same day.

**Proof standards (PROOF_SUBMITTED):**
- Photos: ≥ 10, ≥ 3000px long edge, EXIF timestamps intact, at least one wide shot
  establishing location, one close-up of branding, one showing audience context (no
  identifiable minors; get releases for featured adults).
- Video: ≥ 60s total, 1080p+ (4K preferred), horizontal + vertical cuts, usable audio or
  music-free for licensing safety.
- Disclosure evidence: screenshot/photo of the #ad/#sponsored disclosure as published.
- Delivered to buyer within 48h of execution via shared folder.

## 8. Review, payout, report — budget 45 min

- **Buyer review (BUYER_REVIEW):** 5-business-day acceptance window; silence = auto-accept
  (stated in agreement). One revision round via REVISION_REQUESTED where feasible.
- **Payout release (ACCEPTED → PAYOUT_RELEASED):** seller receives 80% of package price
  (D-005) after acceptance; never before proof acceptance (D-016). Managed-campaign final
  50% invoice goes out at acceptance.
- **Report:** 1-pager — objective, what ran, proof highlights, deliverables checklist, honest
  observations (no invented reach numbers — D-020), rebooking suggestion + referral offer
  (doc 06 §6).
- **Case study:** drafted within 72h of completion, buyer approval required for public use.

### Ops log schema (one row per work session — feeds A-07 and D-009 contribution math)

| Field | Example |
|---|---|
| date | 2026-09-04 |
| campaign_id | C-0003 |
| stage | pre_production |
| activity | venue approval call — card room A |
| minutes | 25 |
| actor | founder |
| billable_to_campaign | yes |
| blockers | waiting on venue GM email |
| notes | GM verbal yes; written OK promised Fri |

Weekly rollup: minutes × $40/hr fully-loaded (D-008 labor model) per campaign → contribution
margin per campaign in the Payments tab.

## 9. Time budget summary

| Stage | Now (≤ 8h) | Target ≤ 3h — how |
|---|---|---|
| Intake | 0:20 | 0:05 — forms auto-validate |
| Qualification | 0:20 | 0:10 — scoring rubric in admin |
| Matching | 0:45 | 0:20 — filterable catalog + saved seller availability |
| Proposal | 0:45 | 0:15 — templated package inserts |
| Agreement + payment | 0:30 | 0:10 — e-sign + payment link automation (D-013 flow) |
| Pre-production | 2:00 | 0:45 — pre-approved venues list, permit playbooks, reusable mockups |
| Day-of execution | 1:30 | 0:45 — seller self-serve runbook + proof upload; we spot-check |
| Proof + review | 0:45 | 0:15 — upload checklist auto-verifies specs |
| Payout + report | 0:45 | 0:15 — templated report, one-click payout release |
| **Total** | **7:40** | **2:40** |

The biggest lever is repeat inventory: campaign #2 at a venue we've already cleared skips
most of pre-production. Curate for repeatability (doc 19 scoring criterion).

## 10. Quality checklist & escalation rules

Pre-flight (no campaign goes live without all boxes):
- [ ] Cash collected per §5 terms
- [ ] Signed agreement with disclosure clause
- [ ] Venue written approval (where applicable) on file
- [ ] Permit determination logged (permit obtained, or written why-none-needed)
- [ ] Approved creative mockup on file
- [ ] Proof spec acknowledged by seller
- [ ] Backup seller booked (campaigns > $1,000)
- [ ] Insurance verified where venue/permit requires COI

Escalations:
- **Safety issue** (any risk to people): stop the activation immediately, no exceptions;
  founder call within 15 min; buyer informed same day; refund or reschedule at buyer's
  choice. Safety > revenue, always (D-016).
- **Venue refusal / approval revoked:** never proceed anyway. Offer buyer: alternate
  pre-cleared venue, reschedule, or full refund of unexecuted portion within 48h.
- **Seller no-show:** activate backup seller (booked at 20% of package payout as a hold fee —
  paid whether or not activated; priced into managed quotes). No backup available →
  buyer chooses reschedule or full refund; no-show seller gets one strike, second strike
  delists. Log every incident in the ops log with reason codes.
- **Content/disclosure violation found in proof review:** withhold payout, require cure
  (re-post with disclosure) before release; repeated violations delist (A-14).
- **Buyer dispute:** move state to DISPUTED, founder handles directly within 24h; refund
  authority up to 100% without further approval — reputation compounds, $1,500 doesn't.

## Open questions

1. Backup-seller hold fee at 20% of payout — is supply deep enough in month 1 to book
   backups at all? If not, restrict the guarantee to campaigns ≥ $1,500.
2. Auto-accept after 5 business days: will agencies accept this clause? Test in first three
   agency agreements.
3. Insurance: at what package size do we require our own event COI vs. relying on venue
   coverage? Needs the doc 22 / legal-review answer before the first street activation.
4. When does proof-spec verification move into the app (upload validator) — campaign #5 or #10?
