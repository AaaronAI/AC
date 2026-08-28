# 10 · User Flows & State Transition Contract

Owner: Product. **This document is the contract that `src/lib/state-machines.ts`
implements** (D-015). State names here are the code's enum values, verbatim. If code
and this doc disagree, one of them is wrong — fix against `DECISIONS.md` D-015 first.

Conventions used below:

- **Roles:** `BUYER`, `SELLER`, `ADMIN`, `SYSTEM` (timers/payment events). RBAC is
  enforced server-side per D-014; a role not listed for a transition receives 403.
- **Notifications:** every listed notification is written as an in-app notification +
  an email-stub record (PRD X-4).
- **Payments:** mock provider models Stripe Connect destination charges (D-013):
  `requires_payment → authorized → captured → (partially_)refunded`; payouts
  `held → released → paid`. Fees per D-005: buyer pays price + 5%; seller receives
  80% of price; payout release is always a manual admin action.
- **Failure rule:** an illegal transition attempt never mutates state; it returns a
  typed error, is logged, and (if attempted via admin UI) shown with the legal next
  steps.

---

## 1. Canonical state sets (D-015, verbatim)

**Listing:** `DRAFT → SUBMITTED → UNDER_REVIEW → (CHANGES_REQUESTED ⇄ SUBMITTED) →
APPROVED → LIVE ⇄ PAUSED → BOOKED → COMPLETED → ARCHIVED`, plus `REJECTED`.

**Campaign:** `BRIEF_SUBMITTED → MATCHING → PROPOSALS_AVAILABLE → OFFER_PENDING →
PAYMENT_AUTHORIZED → BOOKED → PRE_PRODUCTION → APPROVAL_PENDING → IN_PROGRESS →
PROOF_SUBMITTED → BUYER_REVIEW → (REVISION_REQUESTED ⇄ PROOF_SUBMITTED) → ACCEPTED →
PAYOUT_RELEASED → COMPLETED`, with `DISPUTED` and `REFUNDED` reachable from
post-payment states.

Definitions used by this contract:

- **Post-payment states** = `PAYMENT_AUTHORIZED` and everything after it.
- **Entry points:** brief-originated campaigns enter at `BRIEF_SUBMITTED`;
  direct-package bookings enter at `PAYMENT_AUTHORIZED` (flow B) — same machine,
  later entry.
- **Terminal states:** campaign `COMPLETED`, `REFUNDED`; listing `ARCHIVED`,
  `REJECTED`.
- All cancellation paths terminate in `REFUNDED` (there is no separate CANCELLED
  state in D-015). "Refund" covers both void-of-authorization (pre-capture, 100%)
  and full/partial refund of captured funds, per the matrix in
  `08-marketplace-design.md` §6.

---

## 2. Flow A — Brief to completed campaign (primary early flow)

1. **Buyer posts brief** (public post-a-brief flow or dashboard). Campaign created in
   `BRIEF_SUBMITTED`. → Notify admin (new brief), buyer (confirmation + "human review
   within 1 business day").
2. **Admin triages** → `MATCHING`. Rejection at triage (out of area, under-minimum
   budget, T&S fail) → admin closes as unfillable: campaign moves to `REFUNDED`
   trivially only if money existed (it doesn't yet), so pre-payment closure is a
   soft-delete flag `closed_reason` on `MATCHING` — see §8 note N-1. → Notify buyer
   either way.
3. **Admin assembles 2–5 proposals** in the matching workbench (criteria in
   `08-marketplace-design.md` §3) and publishes → `PROPOSALS_AVAILABLE`. → Notify
   buyer ("your options are ready").
4. **Buyer accepts one proposal** → `OFFER_PENDING`; other proposals marked declined
   (reasons logged). → Notify admin + the accepted proposal's seller (heads-up, not
   yet a booking).
5. **Buyer completes checkout**; provider authorizes price + 5% fee →
   `PAYMENT_AUTHORIZED`. Failure: authorization declined → stay `OFFER_PENDING`,
   buyer sees retry UI. Timeout: offer expires after 7 days → back to
   `PROPOSALS_AVAILABLE` (notify buyer + admin).
6. **Seller confirms booking** within 48h → capture funds → `BOOKED`; listing (if
   exclusively committed) `LIVE → BOOKED`. Seller declines or 48h timeout → void
   auth, campaign → `REFUNDED` (100%, no reliability fault if declined within SLA;
   timeout counts against response-time score), admin prompted to re-match (new
   proposal cycle on a fresh offer). → Notify all three parties on every branch.
7. **Pre-production** — admin advances → `PRE_PRODUCTION`: dates locked, checklist
   generated, venue/permit records opened if the listing requires them.
8. **Approvals** → `APPROVAL_PENDING`: venue approval and/or permits tracked in the
   admin queue (PRD A-3). All approvals cleared → admin advances. Venue denies →
   platform no-fault cancellation → full refund → `REFUNDED`. → Notify buyer + seller
   at entry, on each approval event, and on the outcome.
9. **Execution** → `IN_PROGRESS` (admin or SYSTEM on start date). Seller runs the
   campaign checklist, including the required disclosure item (D-016).
10. **Seller uploads proof** → `PROOF_SUBMITTED` (validation per PRD §5.4) → SYSTEM
    notifies buyer → `BUYER_REVIEW`.
11. **Buyer accepts proof** → `ACCEPTED`. (Revision path: §5. Inaction: auto-accept
    warning day 5, SYSTEM auto-accept day 7.) → Notify seller + admin ("payout
    releasable").
12. **Admin releases payout** (manual, D-013) → payout `held → released` →
    `PAYOUT_RELEASED`. → Notify seller with the exact math (e.g., $750 package →
    $600.00, D-005/D-008).
13. **Completion** — SYSTEM on payout `paid` event + proof archived → `COMPLETED`.
    → Notify both sides with review invitations (double-blind, 14 days,
    `08-marketplace-design.md` §5); buyer receives the campaign report
    (`12-design-system.md` §9).

## 3. Flow B — Direct fixed-package booking

1. Buyer selects a package on a `LIVE` listing → checkout shows price, 5% fee, total,
   constraints (incl. venue-approval refund rule where relevant).
2. Authorization succeeds → campaign **created in `PAYMENT_AUTHORIZED`**. Failure →
   no campaign; cart preserved; idempotency key prevents duplicates (PRD §5.2).
   → Notify seller (booking request, 48h SLA) + admin.
3. From here identical to Flow A step 6 onward (`BOOKED → PRE_PRODUCTION →
   APPROVAL_PENDING → IN_PROGRESS → PROOF_SUBMITTED → BUYER_REVIEW → ACCEPTED →
   PAYOUT_RELEASED → COMPLETED`). Steps that don't apply (no venue flag, no permits)
   are auto-cleared by admin advancing through `APPROVAL_PENDING` with an empty
   approvals list — the state is never skipped, it is passed through explicitly.

## 4. Flow C — Seller listing lifecycle

1. **Create** — seller starts the builder → `DRAFT` (autosaved; invisible publicly).
2. **Submit** → `SUBMITTED`. Validation: ≥1 package ≥ $250, deliverables present,
   venue section complete if flagged. → Notify admin (moderation queue).
3. **Review** — admin opens it → `UNDER_REVIEW` (locks seller edits).
   - Approve → `APPROVED` → notify seller.
   - Request changes → `CHANGES_REQUESTED` with written feedback → notify seller;
     seller edits and resubmits → `SUBMITTED` (cycle ⇄ per D-015).
   - Reject (T&S / prohibited category, D-016) → `REJECTED` (terminal) with reason →
     notify seller.
4. **Publish** — seller (or admin on seller's behalf) publishes → `LIVE`. → Listing
   appears in browse; share card generated.
5. **Pause/resume** — seller or admin toggles `LIVE ⇄ PAUSED` (existing campaigns
   unaffected; new bookings blocked). Material edits to a `LIVE` listing send a copy
   through `SUBMITTED` review (PRD §5.3 edge case).
6. **Booked** — an exclusive booking commits the listing → `BOOKED` (SYSTEM,
   side-effect of campaign `BOOKED`). Non-exclusive/recurring listings stay `LIVE`;
   the `BOOKED` listing state is for single-moment inventory.
7. **Campaign execution** — seller works the checklist, uploads proof, gets paid
   (Flow A steps 9–13).
8. **Completed** — when its campaign completes → listing `COMPLETED` (SYSTEM), then
   `ARCHIVED` by admin/SYSTEM after the review window, or cloned by the seller as a
   new `DRAFT` for the next occurrence.

## 5. Flow D — Revision loop

Preconditions: campaign in `BUYER_REVIEW`.

1. Buyer requests revision with a structured reason → `REVISION_REQUESTED`. → Notify
   seller + admin. Counts toward the seller's revision-rate input.
2. Seller fixes and resubmits proof → `PROOF_SUBMITTED` → SYSTEM → `BUYER_REVIEW`.
   → Notify buyer.
3. Loop limit: after the **2nd** revision request on one campaign, SYSTEM flags it to
   admin for mediation (stays in `REVISION_REQUESTED`; admin may coach, mediate, or —
   if the buyer escalates — the buyer opens a dispute per Flow E). No infinite loop.
4. Failure states: seller unresponsive 7 days in `REVISION_REQUESTED` → admin alert →
   admin may cancel seller-fault (refund per matrix → `REFUNDED`, reliability hit).

## 6. Flow E — Dispute and refunds

Preconditions: any post-payment state. Only `BUYER` opens disputes; only `ADMIN`
resolves them; `SELLER` responds with evidence.

1. Buyer opens dispute (structured reason + description + evidence) → `DISPUTED`
   (prior state stored as `dispute_return_state`). Side-effects: payout release
   blocked; reviews held. → Notify seller (respond within 3 business days) + admin.
2. Seller submits response/evidence (no state change). → Notify admin.
3. Admin resolves — exactly one of:

| Resolution | Money movement | Resulting state | Notes |
|---|---|---|---|
| Reject dispute / release | none now; payout path resumes | back to `dispute_return_state` | If that state was `ACCEPTED`, payout is again releasable |
| Resume with partial refund | partial refund to buyer; seller payout reduced correspondingly (matrix §6 or custom + reason) | back to `dispute_return_state` | Both sides notified with math |
| Full refund / terminate | full refund (or void if never captured) | `REFUNDED` (terminal) | Reliability impact per cancellation matrix fault rules |

4. Post-payout dispute (opened from `PAYOUT_RELEASED`): resolution limited to
   goodwill refund from platform funds; seller clawback is out of MVP scope (PRD
   §5.5 edge case). Every resolution writes audit-log + payment events (idempotent).

## 7. Flow F — Cancellation paths

All cancellations apply the matrix in `08-marketplace-design.md` §6 and terminate in
`REFUNDED`. Triggering roles:

| Path | Who may trigger | From states | Money | Side-effects |
|---|---|---|---|---|
| Buyer cancels pre-confirmation | BUYER | `PAYMENT_AUTHORIZED` | Void auth (100%) | None |
| Buyer cancels post-booking | BUYER (self-serve ≥7 days out; via ADMIN inside 7 days) | `BOOKED`, `PRE_PRODUCTION`, `APPROVAL_PENDING` | Refund % by timing; seller share of retained % paid out | Buyer-record note per matrix |
| Seller cancels | SELLER (any time pre-execution) | `BOOKED`, `PRE_PRODUCTION`, `APPROVAL_PENDING` | 100% refund | Reliability penalty by timing; listing `PAUSED` on repeat/late offense |
| Seller no-show | ADMIN (on evidence) | `IN_PROGRESS` | 100% refund | Listing suspended pending review |
| Platform no-fault (venue denial, permit failure, T&S) | ADMIN | any post-payment, pre-`ACCEPTED` | 100% refund | No fault recorded; re-match offered |

Buyer cancellation from `IN_PROGRESS` or later is not a cancellation — it is a dispute
(Flow E). Notifications: all three parties on every cancellation, always including the
exact refund amount and timing.

---

## 8. Listing state transition table

| From | Event | To | Actor | Side-effects / notifications |
|---|---|---|---|---|
| — | `create` | `DRAFT` | SELLER, ADMIN | none |
| `DRAFT` | `submit` | `SUBMITTED` | SELLER | Validate; notify admin queue |
| `SUBMITTED` | `begin_review` | `UNDER_REVIEW` | ADMIN | Lock seller edits |
| `UNDER_REVIEW` | `approve` | `APPROVED` | ADMIN | Notify seller; T&S checklist stored |
| `UNDER_REVIEW` | `request_changes` | `CHANGES_REQUESTED` | ADMIN | Written feedback required; notify seller; unlock edits |
| `UNDER_REVIEW` | `reject` | `REJECTED` (terminal) | ADMIN | Reason required; notify seller; audit log |
| `CHANGES_REQUESTED` | `resubmit` | `SUBMITTED` | SELLER | Notify admin |
| `APPROVED` | `publish` | `LIVE` | SELLER, ADMIN | Public visibility; share card generated |
| `LIVE` | `pause` | `PAUSED` | SELLER, ADMIN | New bookings blocked; active campaigns unaffected |
| `PAUSED` | `resume` | `LIVE` | SELLER, ADMIN | Bookings re-enabled |
| `LIVE` | `exclusive_booking_confirmed` | `BOOKED` | SYSTEM | Fired by campaign `BOOKED`; browse shows "Booked" stamp |
| `BOOKED` | `campaign_completed` | `COMPLETED` | SYSTEM | Fired by campaign `COMPLETED` |
| `BOOKED` | `booking_cancelled` | `LIVE` | SYSTEM | Fired by campaign `REFUNDED` pre-execution; re-listed |
| `COMPLETED` | `archive` | `ARCHIVED` (terminal) | ADMIN, SYSTEM (after review window) | Seller offered "clone to new draft" |
| `LIVE` | `material_edit` | `SUBMITTED` | SELLER | Re-review cycle; prior version stays visible-but-locked |
| `LIVE`/`PAUSED` | `admin_takedown` | `PAUSED` | ADMIN | T&S action; reason + audit log; notify seller |

Illegal examples the tests must assert: `DRAFT → LIVE`, `REJECTED → anything`,
`SUBMITTED → APPROVED` (review may not be skipped), seller calling `approve`.

## 9. Campaign state transition table

| From | Event | To | Actor | Side-effects / notifications |
|---|---|---|---|---|
| — | `submit_brief` | `BRIEF_SUBMITTED` | BUYER | Notify admin + buyer |
| `BRIEF_SUBMITTED` | `triage_accept` | `MATCHING` | ADMIN | Notify buyer |
| `MATCHING` | `publish_proposals` | `PROPOSALS_AVAILABLE` | ADMIN | 2–5 proposals; notify buyer |
| `PROPOSALS_AVAILABLE` | `accept_proposal` | `OFFER_PENDING` | BUYER | Others declined + reasons logged; notify admin, seller |
| `PROPOSALS_AVAILABLE` | `decline_all` | `MATCHING` | BUYER | Reasons logged; notify admin |
| `OFFER_PENDING` | `authorize_payment` | `PAYMENT_AUTHORIZED` | BUYER (SYSTEM records provider event) | Auth for price + 5%; failure → no transition, retry UI |
| `OFFER_PENDING` | `offer_expired` (7d) | `PROPOSALS_AVAILABLE` | SYSTEM | Notify buyer + admin |
| — | `direct_checkout_authorized` | `PAYMENT_AUTHORIZED` | BUYER | Flow B entry; idempotent; notify seller (48h SLA) + admin |
| `PAYMENT_AUTHORIZED` | `seller_confirm` | `BOOKED` | SELLER | **Capture funds**; listing may → `BOOKED`; notify all |
| `PAYMENT_AUTHORIZED` | `seller_decline` / `confirm_timeout` (48h) | `REFUNDED` | SELLER / SYSTEM | Void auth; timeout hits response score; admin prompted to re-match; notify all |
| `PAYMENT_AUTHORIZED` | `buyer_cancel` | `REFUNDED` | BUYER | Void auth (100%) |
| `BOOKED` | `start_preproduction` | `PRE_PRODUCTION` | ADMIN | Checklist generated; venue/permit records opened; notify seller + buyer |
| `PRE_PRODUCTION` | `enter_approvals` | `APPROVAL_PENDING` | ADMIN | Approval tasks listed (may be empty); notify both |
| `APPROVAL_PENDING` | `approvals_cleared` | `IN_PROGRESS` | ADMIN, SYSTEM (start date, if no blocking tasks) | Blocked while any required approval unresolved; notify both |
| `APPROVAL_PENDING` | `venue_denied` / `permit_failed` | `REFUNDED` | ADMIN | No-fault 100% refund; re-match offered |
| `IN_PROGRESS` | `submit_proof` | `PROOF_SUBMITTED` | SELLER | Proof validation (PRD §5.4) |
| `PROOF_SUBMITTED` | `notify_buyer` | `BUYER_REVIEW` | SYSTEM | Review clock starts (7d auto-accept, warning day 5) |
| `BUYER_REVIEW` | `accept_proof` | `ACCEPTED` | BUYER, SYSTEM (auto-accept day 7) | Payout becomes releasable; notify seller + admin |
| `BUYER_REVIEW` | `request_revision` | `REVISION_REQUESTED` | BUYER | Structured reason; revision-rate input; 2-loop cap → admin mediation flag; notify seller + admin |
| `REVISION_REQUESTED` | `resubmit_proof` | `PROOF_SUBMITTED` | SELLER | Notify buyer via `notify_buyer` |
| `REVISION_REQUESTED` | `seller_unresponsive_cancel` (7d) | `REFUNDED` | ADMIN | Refund per matrix; reliability hit |
| `ACCEPTED` | `release_payout` | `PAYOUT_RELEASED` | ADMIN (manual, D-013) | Payout `held → released`; math notification to seller; audit log |
| `PAYOUT_RELEASED` | `payout_paid_and_archived` | `COMPLETED` (terminal) | SYSTEM | Review invites (double-blind 14d); campaign report to buyer; listing → `COMPLETED` |
| any post-payment | `open_dispute` | `DISPUTED` | BUYER | Stores `dispute_return_state`; payout blocked; reviews held; notify seller (3-day response SLA) + admin |
| `DISPUTED` | `resolve_resume` (± partial refund) | `dispute_return_state` | ADMIN | Money math notified to both; audit log |
| `DISPUTED` | `resolve_full_refund` | `REFUNDED` (terminal) | ADMIN | Full refund; fault per matrix; audit log |
| `BOOKED`/`PRE_PRODUCTION`/`APPROVAL_PENDING` | `buyer_cancel` / `seller_cancel` / `platform_cancel` | `REFUNDED` (terminal) | BUYER / SELLER / ADMIN | Matrix % refund + payout share; reliability effects; notify all |

Illegal examples the tests must assert: skipping `APPROVAL_PENDING`;
`PROOF_SUBMITTED → ACCEPTED` (buyer review may not be skipped except by the SYSTEM
auto-accept from `BUYER_REVIEW`); `release_payout` from any state but `ACCEPTED`;
seller calling `accept_proof`; `open_dispute` from pre-payment states; any transition
out of `COMPLETED` or `REFUNDED`.

**Rollback rule (PRD Open Q4):** admin may traverse only edges in these tables. There
are no hidden reverse edges; correcting a mistaken advance uses the matching-direction
edge if one exists, otherwise requires a logged support action defined in code review,
never a raw DB edit.

**Note N-1 (pre-payment closure):** D-015 defines no terminal state before payment.
Briefs abandoned or rejected at triage remain in `BRIEF_SUBMITTED`/`MATCHING` with a
`closed_reason` attribute and are filtered from active queues. Revisit if this pollutes
metrics.

## Open questions

1. Should `closed_reason` (N-1) be promoted to a real `CLOSED` pre-payment state in a
   future D-015 revision? Current answer: no schema change without updating
   DECISIONS.md first.
2. Non-exclusive listings never enter listing-`BOOKED` (§4.6) — confirm with
   engineering that inventory models (one-off moment vs. recurring capacity) are both
   expressible with the D-015 listing set.
3. Auto-accept timing (7 days) — shared open question with PRD §Open-1.
