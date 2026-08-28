# 16 · Analytics & Metrics

Canon: D-009 — **metric #1 is contribution margin from completed campaigns; #2 is repeat
buyer rate.** Cash collected in 30 days ranks above GMV. Signups, listings, and follower
counts are explicitly *not* success metrics. All metrics below are defined against the real
schema (`15-data-model.md`); query sketches are Prisma-flavored SQL over those tables.

Status honesty: the **data layer exists** (`AnalyticsEvent` table + `track()` in
`src/lib/audit.ts`, plus the domain tables themselves); the **admin analytics page is
PLANNED** (queries below are its spec), and PostHog is a later addition. During the
concierge phase, several inputs (labor hours, CAC spend, outbound counts) live in the ops
log/CRM spreadsheet, not the app — marked *(ops log)* below. Per D-020, nothing here is a
target dressed as a result; there are no results yet.

Global conventions: money in cents from the domain tables (never from `AnalyticsEvent`);
"completed" means `Campaign.state = 'COMPLETED'`; period filters use `createdAt`/
`updatedAt` as noted.

---

## 1. Revenue metrics

| Metric | Formula | Source of truth / query sketch |
|---|---|---|
| **GMV** | Σ `Campaign.priceCents` for campaigns with captured payment in period | `SELECT SUM(c.priceCents) FROM Campaign c JOIN Payment p ON p.campaignId=c.id WHERE p.status IN ('CAPTURED','PARTIALLY_REFUNDED') AND p.createdAt IN period` |
| **Net revenue** | Σ `Payment.platformFeeCents` − Σ refunded platform share | Platform fee rows on `Payment`, minus `Refund` amounts allocated to the platform share; refunds join via `Refund.paymentId` |
| **Contribution margin** (metric #1) | Net revenue − processing (`Payment.processingFeeCents`) − payout fees − **direct labor** at $40/hr (D-008) per campaign | Payments tables + per-campaign labor hours *(ops log — no schema field; tracked per A-07)*; reported only for `COMPLETED` campaigns |
| **AOV** | GMV ÷ count of paid campaigns | Same join as GMV, `AVG(c.priceCents)` |
| **Take rate** | (Σ `platformFeeCents`) ÷ (Σ `amountCents`) — or ÷ GMV for the seller-side view | `Payment` table; structurally ≈ 25%/1.05 of buyer total given D-005 (20% + 5%) |
| **Managed-service margin** | (managed campaign fee − pass-through costs − labor) ÷ fee, target 35–50% (D-006) | *(ops log)* — managed line items are not modeled in the schema yet |
| **Refund rate** | Σ `Refund.amountCents` ÷ Σ captured `Payment.amountCents` | `Refund` join `Payment`; watch vs. A-09 reserve (5% of GMV) |
| **Chargeback rate** | provider chargebacks ÷ captured payments | Provider dashboard in production; mock has none. Track as `WebhookEvent.kind='charge.dispute.created'` when real |
| **Revenue by category / city / cohort** | GMV & net revenue grouped | Join `Campaign → Listing → Category` and `Listing.city`; buyer cohort = month of org's first captured payment (`MIN(p.createdAt) GROUP BY c.orgId`) |

## 2. Demand metrics

| Metric | Formula | Source of truth / query sketch |
|---|---|---|
| **Qualified buyers** | orgs matching ICP (D-004) with a real conversation logged | *(ops log/CRM)*; in-app proxy: orgs with ≥1 `Brief` |
| **Briefs submitted** | count `Brief` in period | `Brief.createdAt` |
| **Brief → booking conversion** | briefs that reach a captured-payment campaign ÷ briefs | `Brief → Proposal → Campaign(proposalId) → Payment(status='CAPTURED')`; window: 30 days from brief |
| **Repeat buyer rate** (metric #2) | orgs with ≥2 paid campaigns ÷ orgs with ≥1 paid campaign | `GROUP BY Campaign.orgId HAVING COUNT(paid)≥2`; also segment agency vs. DTC (A-02) |
| **Time to first proposal** | median(`Proposal.createdAt` − `Brief.createdAt`) per brief's first proposal | `Brief` × first `Proposal` |
| **Time to booking** | median(`Payment.createdAt` (captured) − `Brief.createdAt`); for direct package bookings, − `Campaign.createdAt` | Payments join |
| **CAC** | sales+marketing spend ÷ paid campaigns won (A-11: ≤ $400 in month 1) | *(ops log)* — spend is off-app |
| **LTV** | Σ platform net per buyer org over trailing 12m (projected only after n≥10 orgs; label as projection per D-020) | `Payment.platformFeeCents` grouped by `Campaign.orgId` |

## 3. Supply metrics

| Metric | Formula | Source of truth / query sketch |
|---|---|---|
| **Approved listings** | count `Listing.state IN ('APPROVED','LIVE','PAUSED','BOOKED','COMPLETED')` | `Listing`; A-05 target ≥ 20–50 curated in Denver |
| **Qualified / active sellers** | qualified: `identityStatus='VERIFIED'` with ≥1 approved listing; active: ≥1 proposal or booking in trailing 30d | `User`/`SellerProfile`/`Listing`/`Proposal` |
| **Booking rate** | listings with ≥1 paid campaign ÷ LIVE listings (trailing 60d) | `Listing` × `Campaign` × `Payment` |
| **Completion rate** | campaigns reaching `COMPLETED` ÷ campaigns reaching `BOOKED` | `AuditLog` actions `campaign.*->BOOKED` vs terminal state (or state now) |
| **Response time** | median hours, seller first `Message`/`Proposal` after buyer contact; rollup in `SellerProfile.responseHours` | `Message`/`Proposal` timestamps |
| **Reliability** | per seller: completed w/o dispute or no-show ÷ booked; rollup `SellerProfile.reliabilityScore` (0–100), recomputed from history | `Campaign` + `Dispute` per seller |
| **Earnings per active seller** | Σ `Payout.amountCents (status='PAID')` ÷ active sellers | `Payout → PayoutAccount → SellerProfile` |

## 4. Liquidity metrics

| Metric | Formula | Source of truth / query sketch |
|---|---|---|
| **Fill rate** | briefs receiving ≥1 proposal within 7 days ÷ briefs | `Brief` × `Proposal` |
| **Supply/demand ratio by city+category** | LIVE listings ÷ open briefs, grouped `city × category` | `Listing` (city, categoryId) vs `Brief.city` (briefs lack category — join on city only; add category to Brief if this matters — open question) |
| **% briefs with qualified proposal** | briefs with ≥1 proposal priced within budget from a VERIFIED seller ÷ briefs | `Proposal.priceCents ≤ Brief.budgetCents` + seller verification |
| **Median time to match** | median(first `Proposal.status='ACCEPTED'` time − `Brief.createdAt`) | `Proposal` status timestamps (needs an acceptedAt — today approximate via `AuditLog`) |
| **Unbooked inventory** | LIVE listings with 0 paid campaigns in trailing 60d (count & % ) | `Listing` × `Campaign` |
| **Repeat matches** | same org×seller pairs with ≥2 paid campaigns | `Campaign` join `Listing.sellerProfileId`, group `(orgId, sellerProfileId)` |
| **Concentration risk** | top-1 and top-3 buyer orgs' share of GMV (same for sellers) | GMV grouped by `orgId` / seller; alarm > 50% top-1 (risk R-17 in doc 22) |

## 5. Quality metrics

| Metric | Formula | Source of truth / query sketch |
|---|---|---|
| **Proof acceptance rate** | proofs `ACCEPTED` without revision ÷ proofs submitted | `ProofSubmission` × `Revision` |
| **Revision rate** | campaigns entering `REVISION_REQUESTED` ÷ campaigns reaching `BUYER_REVIEW` | `AuditLog` transition rows |
| **Dispute rate** | campaigns with a `Dispute` ÷ paid campaigns | `Dispute` (1:1 with campaign) |
| **Buyer / seller satisfaction** | mean `Review.rating` by author side; n shown alongside (small-n honesty) | `Review` (author role via `User.role`) |
| **On-time completion** | campaigns completed ≤ `scheduledFor` + grace ÷ completed with a `scheduledFor` | `Campaign.scheduledFor` vs completion transition time in `AuditLog` |
| **Content quality** | proxy: buyer content-reuse (license `PAID_MEDIA` upgrades, repeat matches) + manual 1–5 concierge grade per campaign *(ops log)* | `ContentLicense` + ops log — no automated measure; do not fake one |

## 6. Dashboard specs

**Now (concierge phase):** a founder-run weekly query pack over the domain tables — the
exact sketches above — plus the ops-log spreadsheet for labor/CAC. The **in-app admin
analytics page is PLANNED**: one route under the admin area rendering, in order of D-009
priority: (1) contribution margin per completed campaign (table, campaign-level), (2)
repeat buyer rate, (3) cash collected trailing 30d vs the $5,000 D-010 goal, (4) pipeline
funnel (briefs → proposals → paid), (5) liquidity board (fill rate, unbooked inventory),
(6) quality strip (dispute %, revision %, proof acceptance). No vanity tiles: no signup
counts, no listing counts on the front page.

**Later (PostHog):** added behind the same `track()` seam (doc 14 §11) once real traffic
exists — session/funnel analysis, no schema change. `AnalyticsEvent` stays the billing-
grade source of truth; PostHog is exploratory.

## 7. Event taxonomy (`AnalyticsEvent`)

Names are `object.verb`, snake-case props, JSON in `props`. Money props in cents.
Domain tables remain authoritative for money; events are for funnels.

| Event | When | Props |
|---|---|---|
| `user.signed_up` | account created | `role` |
| `listing.submitted` | seller submits for review | `listing_id`, `category`, `city`, `base_price_cents`, `risk_level` |
| `listing.approved` / `listing.rejected` | moderation verdict | `listing_id`, `moderator_id`, `reason?` |
| `listing.viewed` | public listing page view | `listing_id`, `referrer?` |
| `brief.submitted` | buyer submits brief | `brief_id`, `org_id`, `budget_cents`, `city` |
| `proposal.sent` | proposal to buyer | `proposal_id`, `brief_id`, `listing_id`, `price_cents` |
| `proposal.accepted` / `proposal.declined` | buyer decision | `proposal_id` |
| `checkout.started` | buyer begins payment | `campaign_id`, `package_id?`, `amount_cents` |
| `payment.captured` | capture succeeds | `campaign_id`, `amount_cents`, `buyer_fee_cents` |
| `payment.failed` | charge fails | `campaign_id`, `reason` |
| `campaign.state_changed` | every `transitionCampaign` | `campaign_id`, `from`, `to`, `actor_role` |
| `proof.submitted` | seller uploads proof | `campaign_id`, `proof_id`, `captured_at` |
| `proof.accepted` / `proof.revision_requested` | review verdict | `campaign_id`, `proof_id`, `reason?` |
| `payout.released` | admin releases | `campaign_id`, `amount_cents` |
| `dispute.opened` / `dispute.resolved` | dispute lifecycle | `campaign_id`, `opened_by_role` / `resolution` |
| `refund.issued` | any refund | `campaign_id`, `amount_cents`, `reason` |
| `review.submitted` | review posted | `campaign_id`, `rating`, `author_role` |

`campaign.state_changed` is the workhorse: every funnel and time-between-states metric
derives from it (with `AuditLog` as the tamper-evident cross-check).

## 8. Weekly operating review (60 min, written first, every Monday)

1. **Metric #1 & #2 first (10 min):** contribution margin per completed campaign this
   week + cumulative; repeat buyer rate. Compare against D-010 gates
   (`23-kill-pivot-continue-criteria.md`) — state plainly which checkpoint band we're in.
2. **Cash (5 min):** collected this week / trailing 30d vs $5,000 goal; refunds issued.
3. **Pipeline (10 min):** qualified contacts → conversations → briefs → proposals → paid;
   name the stuck stage and the single unblock action.
4. **Liquidity (10 min):** fill rate, unbooked inventory, any brief >7 days without a
   qualified proposal (each gets an owner).
5. **Quality & T&S (10 min):** open disputes, open `RiskFlag`s, proof rejections, any
   disclosure violations (doc 13 §4); venue/permit queue ages.
6. **Assumptions ledger (10 min):** which ASSUMPTIONS.md rows gained evidence this week;
   update confidence honestly; anything falsified triggers its named consequence.
7. **Decisions & risks (5 min):** new DECISIONS.md entries needed; risk register deltas
   (doc 22 triggers fired?). Every action item gets an owner and a date.

Rule: numbers are pulled from the queries above before the meeting and pasted into the
review doc — no "about", no recollection-based metrics (D-020).

## Open questions

- `Brief` has no `categoryId` — supply/demand ratio by category currently joins on city
  only. Add the field, or accept city-level liquidity for launch?
- `Proposal` lacks status timestamps (`acceptedAt`) — derive from `AuditLog` or add
  columns at the Postgres swap?
- Labor hours per campaign live in the ops log; add a `laborMinutes` field on `Campaign`
  so metric #1 is computable in-app? (Leaning yes at the swap.)
- Chargeback rate is undefined until a real provider exists — decide the alerting
  threshold (proposal: any chargeback at n<50 campaigns is a founder-level incident).
