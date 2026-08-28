# 23 · Kill / Pivot / Continue Criteria

Canon: D-010 — first-30-days goal is **3–5 paid campaigns, ≥ $5,000 cash collected,
≥ $1,500 contribution margin**. D-009 defines the ranking: contribution margin from
completed campaigns first, repeat buyer rate second, cash above GMV; signups/listings/
followers count for nothing. This document pre-commits the decisions so they are made
against written thresholds, not against the mood of the week.

Definitions (used everywhere below, no reinterpretation later):

- **Paid campaign** — a `Campaign` with `Payment.status ∈ {CAPTURED, PARTIALLY_REFUNDED}`
  at full agreed price. Verbal commitments, LOIs, "next month for sure," and discounted
  pilots below the D-005/D-006 floors are **not** paid campaigns (discounted pilots are
  tracked separately and never counted toward gates).
- **Cash collected** — captured payments net of refunds, per the `Payment`/`Refund`
  tables. Not invoices sent, not pipeline.
- **Qualified contact** — an ICP-matching org (D-004) where a human decision-maker
  actually engaged (call, meeting, or substantive reply). Logged in the CRM with a date.
- **Repeat interest** — a paying buyer who has booked, scheduled, or requested a concrete
  second campaign in writing.
- **Discovery→proposal rate** — qualified contacts that reach a delivered proposal ÷
  qualified contacts.

The clock starts on **Day 0 = the first day of live selling** (first outbound batch sent),
recorded in the ops log. Not repo-creation day, not deploy day.

---

## The three pre-defined pivots

Pre-defining these prevents inventing a flattering pivot under pressure. Each reuses most
of what is already built (docs + app), which is the point.

- **P1 — Pure managed activation agency.** Drop the marketplace claim; sell campaigns as
  a productized agency with the app as an internal ops tool (state machine, proof,
  payments become internal workflow). Chosen when buyers pay but only with heavy
  concierge and no self-serve signal.
- **P2 — Supply-management SaaS for agencies.** Sell the software (listing/approval/
  proof/payout workflow) to experiential/field-marketing agencies managing their own
  talent and venues. Chosen when ops/tooling impresses but our own demand generation
  fails while agencies keep asking "can we use this for our campaigns?"
- **P3 — Narrow vertical marketplace.** Rebuild the wedge around one proven vertical
  where liquidity actually appeared (e.g. sponsored amateur athletics: race kits, comps,
  park-run series). Chosen when one category clearly outperforms while the "anything
  sponsorable" umbrella confuses buyers.

---

## Checkpoints

### Day 10

| Verdict | Threshold |
|---|---|
| **CONTINUE** | ≥ 30 qualified contacts made; ≥ 5 discovery calls held; ≥ 2 proposals delivered; ≥ 10 curated listings live or in review; poker venue conversation started (A-12) |
| **PIVOT signals** (log, don't act yet) | Zero proposals from ≥ 20 contacts; uniform "concept confusion" in call notes (P3 watch); agencies asking for the tool not the service (P2 watch) |
| **KILL** | Not applicable at day 10 — too early for a kill verdict on this evidence |

### Day 20

| Verdict | Threshold |
|---|---|
| **CONTINUE** | ≥ 1 paid campaign captured; ≥ 60 qualified contacts; ≥ 5 proposals delivered; discovery→proposal ≥ 15%; ≥ 20 curated listings (A-05 on track) |
| **PIVOT signals** | 0 paid despite ≥ 3 proposals (price/packaging problem → P1 test: quote one managed campaign at D-006 pricing); fill rate < 50% on briefs (supply problem → P3 scan of which category fills) |
| **KILL signals** (pre-warning only) | 0 paid AND < 10% discovery→proposal AND ≥ 60 contacts — schedule the day-30 review with kill explicitly on the agenda |

### Day 30 — the D-010 gate

| Verdict | Threshold |
|---|---|
| **CONTINUE** | D-010 met: **3–5 paid campaigns AND ≥ $5,000 cash AND ≥ $1,500 contribution margin** — proceed to scale motions (more supply curation, second stunt, doc 17 GTM next phase) |
| **CONTINUE (probation)** | 2 paid campaigns and ≥ $2,500 cash and at least one repeat interest — one written 15-day extension permitted (see Anti-self-delusion rule 4), with the specific evidence gap named |
| **PIVOT** | 1–2 paid but concentrated signal for a pivot: all revenue effectively managed-service (→ P1); ≥ 2 agencies asked to license the workflow (→ P2); ≥ 70% of paid/near-paid interest in one category (→ P3). Run the §Decision protocol and pick within 7 days |
| **KILL** | **< 2 paid campaigns after ≥ 100 qualified contacts AND < 20% discovery→proposal rate AND zero repeat interest.** All three conditions — this is the pre-agreed kill line and it does not move |

### Day 60

| Verdict | Threshold |
|---|---|
| **CONTINUE** | Cumulative ≥ 6 paid campaigns; ≥ $10,000 cash; ≥ 1 actual repeat **booking** (not just interest); contribution margin per campaign trending up (A-07 labor curve bending); ≥ 1 public case study shipped (D-017 requirement) |
| **PIVOT** | Revenue flat vs day 30 while one pivot signal strengthened; or margin per campaign falling as volume rises (ops doesn't compress → P1 with higher minimums, or P2) |
| **KILL** | < 3 cumulative paid campaigns; or repeat buyer rate = 0 with ≥ 5 distinct paying buyers ever; or contribution margin cumulative < $0 with no written path to positive |
| Also due | Post-pivot check if a day-30 pivot happened: the pivot gets its own 30-day mini-gate written at pivot time |

### Day 90

| Verdict | Threshold |
|---|---|
| **CONTINUE** | ≥ 10 completed paid campaigns (D-001's self-serve unlock threshold in sight); ≥ 3 repeat buyers; cumulative contribution ≥ $5,000; a second D-017 stunt converted; unit economics support either founder salary math or a raise narrative — write which |
| **PIVOT** | Healthy activity but ceiling visible (e.g. every campaign still founder-sold with CAC > $1,000 and no repeat compounding): choose P1/P2/P3 with 90 days of evidence |
| **KILL** | Sub-day-60 performance repeated: fewer than 5 cumulative paid campaigns, or zero repeat buyers, or negative cumulative contribution. Wind down cleanly: complete open campaigns, release payouts, refund the rest, publish the postmortem |

---

## Decision protocol

1. **Who decides:** the founder decides — solo-founder reality (risk R-04). But the
   decision is made *against this document*, in a scheduled review, with at least one
   outside challenger present (advisor/peer investor) whose role is to argue the opposite
   verdict. The challenger's counter-argument is recorded whether or not it prevails.
2. **Written evidence before deciding.** No verdict is uttered before this packet exists:
   - metrics pull per doc 16 (queries run same-day, pasted, dated): paid campaigns, cash,
     contribution per campaign, repeat rate, funnel counts;
   - the CRM export of qualified contacts with stage and verbatim lost-deal reasons;
   - the ASSUMPTIONS.md table re-scored line by line (which rows validated/falsified);
   - one page each for the strongest CONTINUE case, PIVOT case (naming P1/P2/P3), and
     KILL case — written before the review, argued at it.
3. **The verdict is written down** with the thresholds it was tested against, filed as a
   dated entry appended to this doc, and — if it changes strategy — as a new DECISIONS.md
   entry. A pivot verdict includes the pivot's own 30-day gate, authored the same day.
4. **Silence is a verdict:** a checkpoint that passes without the review happening is
   treated as a missed CONTINUE bar and escalates the next checkpoint's scrutiny.

## Anti-self-delusion rules

1. **No counting verbal commitments as revenue.** Only `CAPTURED` payments count.
   "They said yes" is pipeline; pipeline is not a gate metric.
2. **No extending deadlines without a written reason.** One extension per checkpoint
   maximum, 15 days maximum, written *before* the original date passes, naming the
   specific evidence expected by the new date. A second extension request on the same
   checkpoint is automatically a PIVOT/KILL review.
3. **No retroactive threshold edits.** These thresholds may only change via a DECISIONS.md
   entry dated *before* the checkpoint they affect, with the old value preserved here.
4. **Discounts don't validate.** Campaigns sold below the D-005/D-006 floors are labeled
   discounted pilots and excluded from gate counts (they may still inform pivots).
5. **Friendlies are labeled.** Campaigns bought by friends/former colleagues are marked
   `friendly` in the ops log and at most one counts toward any gate.
6. **Falsifiers fire.** When an ASSUMPTIONS.md falsification condition is met, the row is
   marked falsified that week — not "watched" — and the dependent plan element is
   re-decided in writing.
7. **The kill line does not move.** The day-30 kill condition was set while calm; meeting
   it means the decision is already made, and the review is about execution of the
   wind-down, not relitigation.

## Open questions

- Who is the named outside challenger for the day-30 review? Must be booked by day 15.
- Whether a probation CONTINUE at day 30 shifts days 60/90 by the same 15 days
  (proposal: yes, all subsequent checkpoints slide together; the calendar is relative to
  Day 0 + extensions).
- P2 (SaaS) implies a materially different build (multi-tenant, billing); before ever
  choosing it, a one-week feasibility spike is required — where does that time come from
  in a solo-founder wind-down of marketplace ops?
