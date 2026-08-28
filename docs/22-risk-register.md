# 22 · Risk Register

Scoring: Likelihood (L) 1–5 × Impact (I) 1–5 = Score. Likelihoods are founder judgments,
not measurements (D-020) — the "Trigger / early warning" column is what converts judgment
into evidence. Owner is a functional hat; at launch every hat is worn by the founder, which
is itself risk R-04. Review cadence: scores revisited at every weekly operating review
(doc 16 §8) and at each D-010 checkpoint (doc 23).

Categories: MKT (market/demand), OPS (operations), FIN (financial), LEG (legal/
regulatory), T&S (trust & safety), TEC (technical), STR (strategic).

| ID | Risk | Cat | L | I | Score | Mitigation (summary) | Owner | Trigger / early warning |
|---|---|---|---|---|---|---|---|---|
| R-01 | Cold-start liquidity failure — neither enough credible supply nor paying demand in Denver | MKT | 4 | 5 | **20** | Managed-marketplace posture (D-001): founder-sold demand, hand-curated supply; seed listings incl. D-008; stunts (D-017) generate both sides | Founder (GTM) | <20 curated listings after 25 seller interviews (A-05); fill rate <50% at day 20 |
| R-02 | Willingness-to-pay below model ($750–$5k packages don't clear) | MKT | 4 | 5 | **20** | 20 buyer interviews + pilots before scaling; price anchoring via D-008 tiers; pivot options pre-defined (doc 23) | Founder (GTM) | <2 paid campaigns after 100 qualified contacts (A-01); fee cited as blocker >20% of losses (A-04) |
| R-03 | Ops labor eats margin — concierge hours exceed contribution | OPS | 4 | 4 | **16** | Time-track every campaign (A-07); playbook/checklist reuse; refuse campaigns below $250 min / $1,500 managed min (D-005/6) | Founder (Ops) | >10 hrs/campaign with no downward trend by campaign #10 |
| R-04 | Founder key-person — sales, ops, T&S, and code are one human | STR | 4 | 4 | **16** | Everything written down (docs, runbooks, state machines in code); weekly written reviews; no single-session-knowledge processes | Founder | Any week where zero documented process was used to run a campaign; founder unavailable = platform halts |
| R-05 | Venue-approval failure rates gut the inventory that looks best | OPS | 4 | 3 | 12 | Venue approval is first-class (schema + gates); ask venues **before** selling (A-12); build a pre-approved-venue roster | T&S lead | Approval rate <30% (A-06 falsifier); poker listing refused by all approached card rooms |
| R-06 | Permit delays push campaigns past buyer deadlines | OPS | 3 | 3 | 9 | Permit model + `APPROVAL_PENDING` gate; Denver OSE lead times (30+ days for fire/parade) built into scheduling; file one real permit early (A-16) | Founder (Ops) | Any permit >4 weeks or >$500 (A-16 falsifier); first campaign slipped by permits |
| R-07 | Seller no-shows / quality failures | OPS | 3 | 4 | 12 | Payout held until accepted proof (D-016); reliabilityScore + verification tiers; backup-seller plan for flagship campaigns; 100% refund on no-show | T&S lead | Any no-show in first 10 campaigns; completion rate <90% |
| R-08 | Brand-safety incident — seller behaves badly mid-campaign under a buyer's logo | T&S | 3 | 5 | **15** | Human review of every listing (no auto-approval); conduct standards + agreement terms; pause/kill + refund path in state machine; incident comms plan pre-written | T&S lead | Any RiskFlag HIGH on an active campaign; buyer complaint mid-flight |
| R-09 | Participant or bystander injury at an activation | T&S | 2 | 5 | 10 | Prohibit dangerous challenges (doc 13 §15); riskLevel gating; insurance requirements per tier (counsel Q §5); venue/permit compliance | T&S lead | Any near-miss report; any listing proposing physical risk reaching UNDER_REVIEW |
| R-10 | FTC disclosure violation by a seller (or by us as the facilitator) | LEG | 3 | 4 | 12 | Disclosure as a required deliverable checked at proof review; payout blocked on undisclosed content; 16 CFR 255 program (doc 13 §4); counsel review of program adequacy | T&S lead | Any proof rejected for missing disclosure; repeat violations (A-14 falsifier) |
| R-11 | Gambling-adjacency regulatory risk (poker listing) | LEG | 2 | 5 | 10 | D-008 constraints (fixed fee, no share of winnings, no stake in outcome); restricted-category exception process; CO counsel question §3 before Tier 3 sells; casino gaming exists only in Black Hawk/Central City/Cripple Creek — venue rules govern | Risk officer | Counsel flags structure (A-15); any venue/regulator inquiry; sponsor asks for winnings share |
| R-12 | Money-transmission classification of hold-then-release flow | LEG | 2 | 5 | 10 | Build on Stripe Connect (funds flow through regulated processor); never say "escrow" (doc 13 §17); counsel question §2 answered before real money | Risk officer | Counsel advises exposure (A-13 falsifier); any state inquiry |
| R-13 | Chargeback fraud / stolen-card buyers | FIN | 3 | 3 | 9 | Fraud signals list (doc 13 §10); verification tier gate ≥$1,000; 5% GMV reserve (A-09); delay payout release until proof acceptance narrows the window | Risk officer | First chargeback; reserve >80% consumed in a month |
| R-14 | Platform leakage — buyer and seller transact off-platform after intro | STR | 4 | 3 | 12 | Concierge value (permits, venue, proof, payment protection) is the retention product; conduct rules ban circumvention; rebooking discounts cheaper than leakage fight | Founder (GTM) | Repeat buyer books seller #2 directly; sellers asking for buyer contact info pre-payment |
| R-15 | Competitor fast-follow (agency or marketplace clones wedge) | STR | 2 | 3 | 6 | Speed to cases/liquidity in Denver; supply relationships (venues, sellers) as moat; do not compete on take rate early | Founder | A funded competitor announces same wedge; agency productizes it locally |
| R-16 | Concentration on few buyers | FIN | 4 | 3 | 12 | Track top-1/top-3 GMV share (doc 16 §4); cap any single org at ~40% of pipeline attention post-month-2; agency segment spread (D-004) | Founder (GTM) | Top-1 org >50% of GMV at n≥5 campaigns |
| R-17 | Content-rights disputes (usage beyond license, third-party IP in deliverables) | LEG | 3 | 3 | 9 | ContentLicense scope/duration per campaign; usageRightsDays on packages; seller IP warranty in Agreement; prohibited category #15 | T&S lead | Buyer runs paid media on ORGANIC license; takedown/complaint received |
| R-18 | Data breach (credentials, messages, payment metadata) | TEC | 2 | 4 | 8 | Scrypt hashes, HMAC HttpOnly cookies, server-side RBAC (D-014); security checklist (doc 14 §16) before real users; no card data stored (processor-held); minimal PII by design | Tech architect | Any checklist item unchecked at launch; npm audit critical; anomalous admin AuditLog activity |
| R-19 | Negative press from a stunt ("brand pays man to gamble") | STR | 3 | 4 | 12 | Stunt selection already brand-safe-biased (D-017); disclosure everywhere; pre-written framing (sponsorship of a person, fixed fee, no gambling stake); founder does press, sellers don't | Founder | Journalist inquiry; social pile-on >1k engagements on a critical post |
| R-20 | Payment-provider account termination (Stripe risk review dislikes gambling adjacency or holds pattern) | FIN | 2 | 5 | 10 | Honest activity description at Stripe onboarding incl. poker listing; restricted-category list aligned with processor rules; reserve + secondary-processor research parked, not built | Risk officer | Any Stripe restricted-activity notice; payout holds; elevated-dispute email |

### Scoring methodology & register hygiene

- **Likelihood (L):** 1 = remote (<5% in the next 12 months), 2 = unlikely (5–20%),
  3 = possible (20–45%), 4 = likely (45–75%), 5 = expected (>75%). These are stated
  priors; where an ASSUMPTIONS.md row covers the same ground, its falsifier is the
  evidence that moves L.
- **Impact (I):** 1 = nuisance, 2 = costs a week or <$1k, 3 = costs a month or a
  checkpoint, 4 = threatens a D-010 gate or a key relationship, 5 = existential
  (regulatory action, serious injury, shutdown of money movement, or trust collapse).
- **Score bands:** ≥15 = active management (named plan below, reviewed weekly);
  8–14 = monitored (trigger column watched weekly, plan on file); ≤7 = accepted
  (revisit at checkpoints only).
- Hygiene rules: a fired trigger is recorded the week it fires (no retroactive
  smoothing, per D-020); every score change is dated with a one-line reason; risks are
  never deleted, only re-scored — a "resolved" risk keeps its history at L=1.

### How the register connects to the rest of the system

- Triggers that are queryable in-app come from the doc 16 metric queries (fill rate,
  concentration share, refund reserve burn, completion rate) — the weekly review pulls
  them mechanically rather than from memory.
- Triggers that are legal or external (R-11, R-12, R-20) map 1:1 to BLOCKER questions in
  `LEGAL-REVIEW-QUESTIONS.md`; those risks cannot drop below their current scores until
  the corresponding counsel answer exists in writing.
- R-01/R-02 maturing is not handled here at all — it is handled by the pre-committed
  gates in `23-kill-pivot-continue-criteria.md`. This register watches; that document
  decides.

## Top 5 — expanded mitigation plans

Ranked by score: **R-01 (20), R-02 (20), R-03 (16), R-04 (16), R-08 (15).**

### R-01 · Cold-start liquidity failure (L4 × I5 = 20)

The reason D-001 exists. Full plan: (1) **Supply**: founder curates 25–50 Denver listings
in 30 days via direct outreach — every listing concierge-onboarded, no self-serve supply
dependency; seed with D-008 + the D-017 stunt inventory so the marketplace is never
visibly empty. (2) **Demand**: 100 qualified outbound contacts in 30 days against the
D-004 priority order; sell campaigns, not the platform. (3) **Both-sides events**: each
launch stunt is simultaneously supply proof and demand marketing. (4) **Measurement**:
fill rate and % briefs with qualified proposal weekly (doc 16 §4). Early warnings wired to
doc 23 gates: this risk maturing is precisely the day-20/day-30 PIVOT signal, so the
response is pre-decided rather than improvised.

### R-02 · Willingness-to-pay below model (L4 × I5 = 20)

A-01 is Medium confidence and untested; the entire fee model (D-005) sits on it. Plan:
(1) price is discovered through 20 recorded buyer interviews + real proposals, not
surveys; (2) anchor with the D-008 three-tier table so every "no" tells us *which* price
failed; (3) track lost-deal reasons verbatim in the CRM (fee objection vs. concept
objection vs. timing); (4) do not discount below the $250/$1,500 floors to buy fake
validation — a discounted pilot is labeled a discounted pilot in the metrics (D-020);
(5) if falsified, doc 23 pre-commits the pivot menu (managed agency / SaaS / vertical)
instead of a slow bleed of price cuts.

### R-03 · Ops labor eats margin (L4 × I4 = 16)

Contribution margin is metric #1, and labor is its biggest lever (D-008 models $40/hr).
Plan: (1) log hours per campaign from campaign #1 (ops log; candidate `laborMinutes`
field at Postgres swap — doc 16 open questions); (2) publish the per-campaign
contribution table in the weekly review — no averaging away bad campaigns; (3) every
campaign retro extracts one checklist/template that removes repeat work; (4) A-07 gate:
≤6 hrs/campaign by campaign #10, falsified at >10 hrs with no downward trend — falsification
triggers either price floor increase or scope reduction, decided in writing; (5) refuse
unprofitable heroics: a campaign projected below $0 contribution needs a written reason
(case-study value) signed off in the ops log before acceptance.

### R-04 · Founder key-person (L4 × I4 = 16)

Plan: (1) canon docs (DECISIONS/ASSUMPTIONS + this doc set) are the operating manual —
any competent operator should be able to run a campaign from doc 07 + the state machine;
(2) code enforces process (transitions, audit log) so process doesn't live in memory;
(3) credentials in a shared vault with a designated emergency contact; (4) weekly review
is written before it is discussed, so the record survives the founder's absence; (5) the
first contractor hire is scoped to concierge ops (the most time-consuming, most
documented function), not engineering. Residual risk accepted at this stage: a solo
founder is the model until D-010 gates pass.

### R-08 · Brand-safety incident mid-campaign (L3 × I5 = 15)

One bad screenshot can end buyer trust before liquidity exists. Plan: (1) prevention —
human review of 100% of listings with the doc 13 §14 checklist, conduct standards in the
signed Agreement, higher bar (VERIFIED + references) for HIGH `riskLevel`; (2) detection —
on-platform messaging monitored on flagged campaigns, buyers told explicitly to report
issues in-thread (creates the record); (3) response runbook — pause campaign (state
machine), open dispute on buyer's behalf if needed, refund fast and fully when we're wrong
(cheaper than the story), `ModerationAction` PAUSE/BAN, notify the venue if one is
involved; (4) comms — founder owns external statements; pre-written holding language
exists before the first campaign; never blame the seller publicly; (5) postmortem within
72h, filed against this register and the moderation checklist.

## Open questions

- Insurance is the unresolved backbone under R-08/R-09: which coverage (GL, contingent
  liability) must exist *before* the first physical activation — pending counsel/broker
  answers (`LEGAL-REVIEW-QUESTIONS.md` §5). Until answered, `riskLevel=HIGH` physical
  activations should not be sold. Explicitly includes the poker Tier 3 exclusive activation.
- Likelihood scores above are unvalidated priors; after 10 campaigns, re-score from
  observed frequencies and note deltas here.
- R-20 needs a real conversation with Stripe (activity description pre-clearance) rather
  than a guess — schedule at integration time, before marketing the poker case study.
