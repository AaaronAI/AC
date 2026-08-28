# 25 · Launch Runbook — Week One, Day by Day

Owner: Founder (solo operator). Conforms to `DECISIONS.md` (D-003, D-004, D-008,
D-010, D-016, D-017, D-020). Stunt scoring: `19-launch-stunts.md`. Kill/pivot gates:
`23-kill-pivot-continue-criteria.md`. This is an execution document: checklists,
volumes, and fallbacks — not strategy.

Assumed cadence: Launch Day = **Day 1 (a Monday)**. All outbound volumes are
founder-personal sends (no automation blasts; quality outbound per A-11's CAC test).

---

## 1. Pre-launch checklist (complete before Day 1; hard gate)

### Product / infra

- [ ] App deployed to Vercel production; Supabase Postgres migrated and seeded
      (D-011/D-012); smoke test on production URL.
- [ ] Auth verified for all three roles; RBAC spot-checked on admin routes (D-014).
- [ ] **Payment flow tested end-to-end** on the provider in use at launch: authorize
      → capture → hold → manual payout release → full and partial refund. If real
      Stripe keys are live, run one $250 real-card test transaction and refund it;
      log evidence in the ops log. If launch is mock-provider (founder invoicing
      out-of-band), state that honestly in checkout copy — no fake "secure payment"
      claims (D-013, D-020).
- [ ] State machine e2e (Playwright) green on the two golden paths
      (`10-user-flows.md` flows A and B).
- [ ] Notifications/email delivery decision executed (PRD Open Q3) and test emails
      received.

### Catalog / content

- [ ] **Seed catalog live:** ≥ 10 moderated, bookable Denver listings, including the
      D-008 poker listing at $450/$750/$1,500 with its constraints displayed; every
      demo/example element labeled as such (D-020).
- [ ] Seller agreements + disclosure checklist templates ready per listing type.
- [ ] **Proof templates ready:** timestamp-chip capture instructions for sellers,
      deliverables-map template, campaign-report template (`12-design-system.md`
      §6–8) exercised once with test data.
- [ ] Share cards rendering for all live listings.

### Legal / trust

- [ ] Legal placeholder pages (terms, privacy) live and **labeled "draft — pending
      counsel"**; `LEGAL-REVIEW-QUESTIONS.md` sent to counsel; A-13/A-15 questions
      flagged as blocking Tier 3 poker sales until answered.
- [ ] Venue outreach for poker stunt already in flight (see Day 1 — approval takes
      days; start pre-launch, tests A-12).
- [ ] Refund reserve funded (5% of expected GMV, A-09).

### Ops

- [ ] Outbound target list built: 100 qualified contacts tiered per D-004 — ~40
      agencies, ~35 consumer startups/DTC, ~25 Denver local businesses — with named
      humans, not info@ addresses.
- [ ] Metrics dashboard (§5) reachable in one click; ops log + per-campaign
      time-tracking sheet ready (A-07).
- [ ] Contingency triggers (§4) written into calendar reminders (Day 5, Day 7,
      Day 10 checkpoints).

## 2. Days 1–7

Daily fixed blocks (solo-founder time-blocking, ~10h/day launch week):

| Block | Time | Work |
|---|---|---|
| Queues | 08:00–09:00 | Admin queues to zero: moderation, briefs, bookings, proof, payments (§5 dashboard first) |
| Outbound | 09:00–12:00 | New outbound + follow-ups (volumes below) |
| Ops/stunt | 13:00–16:00 | Stunt logistics, venue/permit work, seller support, campaign execution |
| Content | 16:00–18:00 | Content capture/edit, case-study drafting, share posts |
| Close | 18:00–18:30 | Dashboard snapshot into ops log; tomorrow's top 3 |

### Day 1 (Mon) — go live

- Flip production live; final smoke test; post launch announcement (personal
  channels + one Denver community channel): the story per `11-brand-strategy.md`,
  the poker listing as the hero example.
- Outbound: **15 new contacts** (agency-heavy per D-004) — personal notes referencing
  a specific listing or offering a brief call. No mass-mail tooling.
- Stunt #1 (poker, D-017/D-008): confirm venue-approval status with the card room(s)
  already contacted pre-launch; if approved, book the tournament date and open the
  venue-approval record in admin (PRD A-3); order placement materials (patch/shirt,
  table signage as permitted) same day.
- Content: capture "day 1" behind-the-scenes honestly (building-in-public, no fake
  traction claims).

### Day 2 (Tue)

- Outbound: 15 new + follow-up wave 1 (Day-1 non-repliers get one value-add nudge in
  48–72h, not daily pestering).
- Calls: hold any booked intro calls; every call ends with a concrete next step
  (brief posted with the buyer on the call, or a named decline reason → logged).
- Stunt: finalize poker deliverables checklist incl. disclosure plan (visible
  signage/verbal per venue rules, D-016); dry-run the proof capture kit (phone,
  timestamp settings verified, shot list from `12-design-system.md` §6).
- Sellers: recruit 2–3 new listings aimed at whatever briefs/interest Day 1 surfaced
  (demand-led supply per `08-marketplace-design.md` §2).

### Day 3 (Wed)

- Outbound: 15 new + follow-ups. Running total: 45 contacted.
- First proposals: any brief received by now gets proposals within the 3-business-day
  SLA — assemble in the matching workbench, 2–5 options each.
- Stunt: if venue approval confirmed → sell it: offer the poker packages directly to
  the 5 warmest conversations (it is the most concrete thing we have). If still
  pending → escalate: in-person venue visit today (see §4-C1).
- Content: draft case-study skeleton for stunt #1 now (structure: objective → cost →
  execution → proof → what the brand got), to be filled only with real numbers after
  execution (D-020).

### Day 4 (Thu)

- Outbound: 15 new + follow-ups (60 total).
- Pipeline hygiene: every contact in exactly one stage — contacted / replied / call
  / brief-or-proposal / paid / dead(reason).
- Execute any booked micro-campaign or content-capture session for a non-stunt
  listing (dog-walking or bike-commute prep per D-017 if poker is date-blocked).
- Admin: process any first real payments carefully — authorization, capture on
  seller confirm, receipts correct (D-005 math shown to the penny).

### Day 5 (Fri) — checkpoint 1

- Outbound: 15 new + follow-ups (75 total).
- **Checkpoint:** reply rate vs. thresholds in §4-C2; venue status vs. §4-C1. Act on
  triggers — do not wait for Day 10 if signals are already at zero.
- Stunt: lock tournament-day run-of-show (arrival, placement setup, capture shot
  list, disclosure checks, teardown); confirm seller (Aaron) briefing done and
  agreement signed.
- Content: week-1 recap post — honest numbers only (e.g., "75 outreach, N replies, N
  briefs, N booked").

### Day 6 (Sat) — stunt execution window

- If the tournament (or fallback stunt) runs this weekend, today is execution:
  1. Arrive early; re-confirm venue permissions on site with the manager on duty.
  2. Set placement exactly as approved — nothing beyond what the venue permitted
     (D-008 constraint).
  3. Capture proof per shot list: before/after of the placement, timestamped photos,
     short video, disclosure evidence (signage/#ad on any social posts).
  4. Live-post only what the venue allows; no filming other patrons without consent.
  5. Log actual hours + costs in the ops log (feeds A-07 and the case study).
- If no execution this weekend: catch-up day — seller onboarding, listing photos,
  proof-template polish. Protect at least a half-day off; week 2 also needs a
  founder.

### Day 7 (Sun) — close the week

- Complete any post-execution flow in-product: proof uploaded → buyer review →
  acceptance → **payout released via admin** (the full D-015 loop on a real
  campaign is itself a launch deliverable).
- Draft case study with real numbers (cost, deliverables, proof assets); publish
  only with buyer + venue + seller sign-off. Target: public within 60 days per
  D-017; sooner is better.
- Week-1 review against D-010 trajectory (3–5 paid campaigns / $5k cash in 30 days):
  compute required run-rate for weeks 2–4; set week-2 outbound plan (default: 10/day
  + deeper follow-ups; adjust per §4-C2).

## 3. Roles (solo founder wearing them explicitly)

| Hat | When | Non-negotiables |
|---|---|---|
| Concierge/admin | Daily 08:00 block + as bookings land | Queues to zero daily; SLA: brief triage < 1 business day |
| Sales | Daily 09:00–12:00 | 15/day week 1; every reply answered same day |
| Producer | Afternoons | Venue/permit work never waits on outbound; permits are the long pole (A-16) |
| Content/brand | 16:00–18:00 | Honest numbers only; voice per `11-brand-strategy.md` §4 |
| CEO/finance | Fri + Sun | Dashboard snapshot daily; reserve + cash position weekly |

Rule: transactional work (a live campaign, a paying buyer, a proof review) preempts
everything else on this list.

## 4. Contingency plans

| # | Trigger | Action |
|---|---|---|
| C1 | **No venue approval** for the poker stunt by Day 3 (A-12 risk) | In-person visit Day 3; offer smallest footprint (apparel-only placement, Tier 1). Still no by Day 5 → **switch flagship to fallback listing**: "Sponsor a Denver dog-walking day" (D-017 #2 — permitted-park route, no venue gatekeeper). Poker listing stays live labeled "pending venue approval — Tier 1 only"; Tier 3 not sold until approval AND counsel clearance (A-15). |
| C2 | **Zero (or near-zero) replies** — < 5% reply rate at Day 5, or no positive replies by **Day 10** | Day 5: rewrite outreach (lead with the single most concrete listing + price, cut any concept-pitching). **Day 10: revise targeting** — re-weight toward the segment with any signal (D-004 order is a hypothesis, not a law); switch channel mix (warm intros + walk-in local Denver businesses over cold email); consider price-anchor test at Tier 1 $450. Log as evidence against A-01/A-11 for the Day-30 gate. |
| C3 | Buyer wants to pay but balks at platform checkout ("not a real platform" risk, A-18) | Founder closes it as a **managed campaign** (D-006, min $1,500) with invoice; deliver through the same admin pipeline so proof/data still accrue. |
| C4 | Payment/production incident (failed capture, refund needed, provider issue) | Stop selling that path; resolve the affected buyer same-day with 100% refund if in doubt (matrix override, logged); post-mortem in ops log before re-enabling. |
| C5 | Seller no-show or quality failure during stunt week | Apply the cancellation matrix (100% refund, listing suspended); founder personally offers the buyer a re-match within 48h; do not paper over — the honest recovery is the brand. |
| C6 | Press/viral moment arrives early | Point everything at the case-study page + brief flow; do NOT open self-serve or relax moderation to absorb demand (D-001 gates hold); waitlist non-Denver interest. |
| C7 | Permit blocked for street-level stunts (A-16) | Move activation onto private property with owner consent, or venue-hosted format; log actual permit timeline/cost against A-16. |

## 5. Daily metrics dashboard (checked at 08:00, snapshotted at 18:00)

Admin analytics (PRD A-9) plus the ops log. Ranked per D-009 — cash and contribution
first, vanity last (signups/followers deliberately absent).

| Metric | Definition | Week-1 healthy signal |
|---|---|---|
| **Cash collected (cumulative)** | Captured payments, net of refunds | > $0 by Day 7; on-trajectory for ≥ $5,000/30d (D-010) |
| **Contribution margin to date** | Per-campaign gross take − processing − logged labor | Positive on every completed campaign |
| **Pipeline** | Counts by stage: contacted / replied / call / brief-proposal / paid / dead | 75 contacted; reply ≥ 10%; ≥ 3 calls; ≥ 2 briefs or proposals out |
| **Campaigns in flight** | Campaigns in `BOOKED`…`BUYER_REVIEW`, each with its state + next action + owner | Every in-flight campaign has a next action dated within 48h |
| **Proof pending** | Campaigns in `PROOF_SUBMITTED`/`BUYER_REVIEW` + hours until auto-accept | Nothing sits > 24h without a nudge |
| Payouts owed | `ACCEPTED` awaiting manual release | Released same business day as acceptance |
| Briefs SLA | Oldest untriaged brief age | < 1 business day, always |
| Approvals/permits | Open venue/permit records by status | No record without an action in past 48h (feeds A-06/A-16) |
| Disputes/refunds | Count + reserve consumption % | 0; reserve < 80% consumed (A-09 tripwire) |
| Concierge hours/campaign | From time log | Trending toward ≤ 6h (A-07) |

Snapshot ritual: 3 lines in the ops log — numbers, the single biggest blocker, and
tomorrow's top action. This log is also the raw material for the honest
building-in-public content stream.

## Open questions

1. Launch payments posture: real Stripe keys by Day 1, or mock + founder invoicing
   for week 1? Depends on Stripe account/Connect onboarding timing — decide at
   pre-launch checklist review; checkout copy must match reality either way.
2. Which Denver community channel gets the Day-1 announcement (relevance vs. reach)?
   Pick one; don't spray.
3. Tournament schedule dependency: if area card rooms run the target $200 buy-in
   event on a weekday, Day 6 shifts — build the run-of-show against the actual
   venue calendar during pre-launch outreach.
4. Should C3 managed-campaign saves count toward the D-010 "3–5 paid campaigns"
   gate? Current stance: yes if delivered through the full proof pipeline; confirm
   in `23-kill-pivot-continue-criteria.md`.
