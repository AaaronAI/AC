# ASSUMPTIONS.md — Recorded Assumptions

Every material assumption behind the plan, labeled by confidence and how we will test it.
Hypotheses are not facts; nothing here has been validated by real transactions unless
explicitly marked VALIDATED (none are yet).

| # | Assumption | Confidence | How we test it | Falsified if |
|---|---|---|---|---|
| A-01 | Brands will pay $750–$5,000 for packaged real-world micro-sponsorships with proof | Medium | 20 buyer interviews + 3–5 paid pilots in 30 days | < 2 paid campaigns after 100 qualified outbound contacts |
| A-02 | Agencies become the highest-LTV repeat buyers | Medium | Track repeat rate by segment across first 20 campaigns | Agency repeat rate < DTC repeat rate at n≥10 |
| A-03 | Sellers will accept an 80% payout share | High | 25 seller interviews; listing acceptance rate | > 40% of qualified sellers decline on fee grounds |
| A-04 | A 5% buyer fee does not materially hurt conversion at $750–$5k AOV | Medium-high | A/B on proposals (fee-inclusive vs. line-item) | Fee cited as blocker in > 20% of lost deals |
| A-05 | Denver has ≥ 50 credible sponsorable moments/quarter that pass moderation | Medium | Curate 25–50 in first 30 days | < 20 curated after 25 seller interviews |
| A-06 | Venue approval is obtainable for ~60%+ of venue-dependent listings | Low-medium | Track approval outcomes in admin from day one | < 30% approval rate |
| A-07 | Concierge labor per managed campaign ≤ 6 hours by campaign #10 | Medium | Time-track every campaign in ops log | > 10 hrs/campaign with no downward trend |
| A-08 | 2.9% + $0.30 processing and ~0.25% + $0.25 payout costs (Stripe published pricing) | High | Verify against Stripe pricing page at integration time | Materially different negotiated/actual rates |
| A-09 | Refund + chargeback reserve of 5% of GMV is sufficient at launch | Low-medium | Measure actual refund/dispute rate over first 20 campaigns | Reserve consumed > 80% in any month |
| A-10 | Proof-of-completion packages materially increase repeat purchase | Medium | Compare rebooking rate with/without full proof delivery | No difference at n≥15 |
| A-11 | Buyer CAC via founder-led outbound ≤ $400/paid campaign in month 1 | Low-medium | Pipeline tracking (contacts → calls → proposals → paid) | CAC > $1,000 with < 20% proposal-win rate |
| A-12 | The poker-tournament listing is venue-approvable in at least one Denver-area card room | Low | Ask venues directly before selling Tier 3 | All approached venues refuse any visible branding |
| A-13 | Money flow (platform captures funds, releases payout after acceptance) does not require money-transmitter licensing when built on Stripe Connect | Medium — needs counsel | Attorney review (see LEGAL-REVIEW-QUESTIONS.md) | Counsel advises otherwise |
| A-14 | FTC endorsement-disclosure compliance (clear #ad/#sponsored) is operationally enforceable via deliverable checklists | High | T&S checklist on every campaign | Repeated violations found in proof review |
| A-15 | A $200-entry poker tournament sponsorship can be structured so the sponsor has no stake in gambling outcomes | Medium — needs counsel | Fixed-fee structure (sponsor pays for placement/content only); attorney review | Counsel advises the structure is a gambling interest |
| A-16 | Denver/Colorado permits for small street activations are obtainable in < 2 weeks and < $200 for most concepts | Low | File one real permit during the pilot | Typical timelines > 4 weeks or costs > $500 |
| A-17 | SQLite→Supabase Postgres migration is a config + migration exercise, not a rewrite | High | Prisma schema kept Postgres-compatible; CI check | Feature requires Postgres-only behavior in MVP |
| A-18 | Buyers accept manual (concierge) fulfillment behind a polished software front end | High | Pilot campaigns | Buyers churn citing "not a real platform" |

## Explicitly unvalidated

- No buyer or seller interviews have occurred yet. Interview scripts exist; results do not.
- No willingness-to-pay data exists beyond comparable-market reasoning in
  `01-market-and-competitor-research.md`.
- All financial scenarios in `21-financial-scenarios.md` and `data/financial-model.csv` are
  models, not measurements.
