# LEGAL-REVIEW-QUESTIONS.md — Questions for Counsel

We are not lawyers and nothing in this repo is legal advice or a legal conclusion. This is
the numbered agenda for a real attorney (Colorado-licensed for the state items;
advertising/FTC and payments specialists as needed). For each question: **why it matters**
and **what we are doing provisionally** until counsel answers. External references cited
are the sources we read, not authority for any conclusion.

Priority key: **[BLOCKER]** = answer required before real money / the flagged activity;
**[PRE-SCALE]** = answer required before self-serve or before the activity grows.

---

## 1. Entity & contracts

1. **[BLOCKER]** What entity structure and state of formation do you recommend for a
   Colorado-operated managed marketplace (single-member LLC vs. Delaware C-corp given a
   possible later raise)?
   *Why:* liability shield before the first physical activation; every contract needs a
   real counterparty. *Provisional:* no real-money campaigns are run pre-formation.
2. **[BLOCKER]** Please draft/review the platform Terms of Service and the two-sided
   marketplace agreement: platform-as-intermediary role, seller performance obligations,
   buyer payment obligations, limitation of liability, indemnities, arbitration/class
   waiver enforceability in Colorado.
   *Why:* every campaign runs on these terms. *Provisional:* demo `Agreement.text`
   (`version: "v1-demo"`) is placeholder and is labeled as such; no real campaign uses it.
3. **[BLOCKER]** Are our content-license terms (per-campaign `ContentLicense`:
   ORGANIC vs PAID_MEDIA scope, default 30-day duration; `usageRightsDays` per package)
   sufficient to actually convey the intended rights from seller to buyer, including
   sublicensing to the buyer's agency?
   *Why:* content reuse is a core buyer benefit; a defective license chain creates
   infringement exposure for buyers — our best customers. *Provisional:* scope kept
   narrow (organic, 30 days) and stated in the campaign agreement text.
4. **[PRE-SCALE]** Is our agreement-acceptance flow valid: click-through acceptance
   recorded as `buyerAcceptedAt`/`sellerAcceptedAt` timestamps against a versioned
   agreement text — adequate under ESIGN/UETA? Do we need version-diff notice and
   re-acceptance on changes?
   *Why:* enforceability of everything in Q2–Q3 rides on acceptance evidence.
   *Provisional:* store full agreement text per campaign (not a pointer), both timestamps,
   and audit-log entries.

## 2. Money flow

5. **[BLOCKER]** Money-transmitter exposure: buyer funds are captured to the platform's
   account (via Stripe Connect in production) and the seller's payout is released after
   proof acceptance — sometimes days or weeks later. Does this hold-then-release pattern,
   built on Stripe Connect (separate charges and transfers), keep us outside federal
   (FinCEN) and state money-transmitter licensing — Colorado Money Transmitters Act
   included? Does the answer change with hold duration?
   *Why:* Assumption A-13 (Medium, needs counsel); mis-classification is
   business-ending. *Provisional:* mock payments only; no real funds move; we use
   Stripe-processed flows exclusively in the production design and we never market the
   hold as "escrow" (see Q6).
6. **[BLOCKER]** Confirm our language policy: we describe buyer protection as "payment
   captured, payout released after proof acceptance" and never as "escrow." Is any of our
   draft copy still implying a regulated custody arrangement?
   *Why:* escrow is a licensed activity in many states; claiming it falsely is itself
   deceptive. *Provisional:* "escrow" is banned in product/marketing copy (doc 13 §17).
7. **[BLOCKER]** Refund obligations: our cancellation tiers (STANDARD/FLEXIBLE/STRICT)
   and dispute resolutions (full/partial refund) — any Colorado consumer-protection
   constraints on non-refundable tiers, and who legally owes the refund if the platform
   is merchant of record?
   *Why:* we absorb refund/chargeback risk (doc 14 §4.3); we need the obligation map to
   size the reserve. *Provisional:* seller non-delivery always = 100% refund including
   buyer fee, resolved before payout release wherever possible.
8. **[PRE-SCALE]** Tax reporting: our reading of current public sources is that the
   1099-K threshold reverted to $20,000 / 200 transactions and the 1099-NEC/MISC
   threshold rises to $2,000 for payments made in 2026 (One Big Beautiful Bill Act) —
   please confirm what applies to us, whether Stripe files 1099-Ks for Connect payees or
   we file 1099-NECs, and when we must collect W-9s.
   *Why:* seller payouts start small but cross thresholds fast. *Provisional:* collect a
   W-9 from every seller before first payout regardless of threshold; sources we read:
   https://www.avalara.com/blog/en/north-america/2025/07/one-big-beautiful-bill-act-1099-reporting-threshold.html and
   https://www.irs.gov (to be confirmed by counsel/CPA).

## 3. Poker / gambling adjacency (the D-008 flagship listing)

9. **[BLOCKER]** Can a sponsor lawfully pay a **fixed placement fee** for a player
   (Aaron) to carry branding at a $200-entry poker tournament, where the sponsor has
   **no share of winnings and no financial interest in the gambling outcome** (D-008
   constraints; Assumption A-15)? Does the analysis change if the sponsorship fee happens
   to equal or exceed the entry fee — i.e., could it be recharacterized as staking?
   *Why:* this is the seed listing and launch stunt; if the structure is a gambling
   interest, the flagship dies. *Provisional:* fixed fee for placement/content only,
   contract explicitly disclaims any interest in results; Tier 3 not sold pre-review.
10. **[BLOCKER]** Colorado-specific: casino gaming is constitutionally limited to Black
    Hawk, Central City, and Cripple Creek and regulated by the Colorado Division of
    Gaming (https://sbg.colorado.gov/what-is-legal-gambling-questions-in-colorado) — so a
    "$200 Denver poker tournament" is either (a) at a licensed casino in those towns,
    (b) a charitable/social game, or (c) potentially unlawful. What diligence must we do
    on the tournament's own legality before attaching a sponsor, and does sponsoring a
    player at an unlawful game expose us under CRS 18-10 (professional gambling/
    facilitation)?
    *Why:* we cannot verify the tournament's legal basis ourselves. *Provisional:* the
    listing requires venue approval (a licensed venue implies a lawful game) before any
    branding is confirmed; no branding, no campaign, at any venue that won't confirm in
    writing.
11. **[BLOCKER]** Casino property rules: what may a player wear/display on a licensed
    gaming floor, and does venue consent fully cover us, or do Division of Gaming
    advertising rules independently constrain sponsor branding at tables?
    *Why:* D-008 promises "placement only where casino/tournament permits" — we need to
    know whether venue permission is sufficient. *Provisional:* written venue approval
    required and stored (`VenueApproval`); riskLevel HIGH; restricted-category exception
    process applies (doc 13 §16).
12. **[PRE-SCALE]** Should our prohibited-categories line "unlicensed gambling
    promotions" be broadened or narrowed for sponsorships *of players* vs promotions
    *of gambling operators*? We currently allow the former via exception only.
    *Why:* future listings will test the boundary. *Provisional:* operators/apps/books
    are refused outright; player sponsorships case-by-case with counsel.

## 4. FTC endorsement compliance

13. **[BLOCKER]** Review our disclosure program (doc 13 §4) for adequacy under the
    revised Endorsement Guides, 16 CFR Part 255 (2023)
    (https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255): disclosure
    as a required deliverable, proof review before payout, revision/flag/ban ladder. As
    the platform arranging the payments, what is *our* exposure for a seller's inadequate
    disclosure, and does our review/approval role increase it?
    *Why:* A-14 assumes checklist enforcement suffices; the FTC has pursued
    intermediaries. *Provisional:* payout blocked on undisclosed content; buyer told they
    may not request undisclosed placements (conduct standards).
14. **[PRE-SCALE]** Physical-world disclosures: for placements with no accompanying
    social post (a branded race kit, a table patch), what disclosure, if any, is required
    at the placement itself?
    *Why:* many of our formats are physical-first; "Disclosures 101" speaks mostly to
    social media (https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers).
    *Provisional:* we require visible sponsor identification wherever the paid
    relationship isn't obvious, and disclosure on all connected content regardless.

## 5. Insurance

15. **[BLOCKER]** What insurance must the platform carry before the first physical
    activation: commercial GL, contingent liability for seller-run activations/stunts,
    E&O for the marketplace function? At what limits for the D-017 stunt slate?
    *Why:* risks R-08/R-09 (doc 22); an injury at a sponsored activation is the worst
    plausible early event. *Provisional:* no HIGH-riskLevel physical activation is sold
    until this is answered; broker conversation queued alongside counsel.
16. **[PRE-SCALE]** When should we require sellers or venues to carry their own coverage
    and name the platform (and the sponsor?) as additional insured — by `riskLevel` tier?
    *Why:* pushes risk to the party controlling it; buyers will ask. *Provisional:*
    venue's own requirements honored; nothing additional demanded of sellers yet.

## 6. Permits & public space (Denver)

17. **[PRE-SCALE]** For small street/park activations in Denver, which of our recurring
    formats (coffee-cart takeover, dog-walking day, park-run series, farmers-market
    booth) require OSE special-event permitting vs. fitting under ordinary commercial
    activity, and where is the line for "advertising in public right-of-way"?
    *Why:* A-16 assumes <2 weeks/<$200 permits — Low confidence; Denver's published
    guidance shows 21–45-day lead items (street occupancy via DOTI, park pre-permits,
    fire) (https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Office-of-Special-Events/Permitting-Special-Events).
    *Provisional:* `Permit` tracking is first-class; campaigns hold in APPROVAL_PENDING
    until permits are GRANTED; we file one real permit during the pilot to calibrate.
18. **[PRE-SCALE]** Does paying an individual to carry advertising in public (bike
    commutes, dog-walking) implicate Denver sign/advertising codes or solicitation rules?
    *Why:* two of the three launch stunts are exactly this. *Provisional:* no fixed
    installations, nothing attached to public property, activity stays within normal
    pedestrian/cyclist use.

## 7. IP & publicity rights

19. **[PRE-SCALE]** Review our release chain: sellers warrant releases from identifiable
    people in deliverables and rights to third-party material (agreement warranty).
    Do we need signed release *templates* collected per campaign, and what about
    incidental bystanders in public-space footage used commercially?
    *Why:* buyer reuse in paid media raises the stakes (right-of-publicity claims).
    *Provisional:* PAID_MEDIA license sold only where releases exist; bystander-heavy
    concepts flagged in moderation.
20. **[PRE-SCALE]** Third-party marks in content: event names, venue signage, team
    logos incidentally visible in proof/content — where is incidental use safe vs.
    an implied-endorsement problem for the sponsor?
    *Why:* prohibited category #15 needs a workable boundary, not a blanket ban on
    reality. *Provisional:* no deliberate framing of third-party marks; venue approval
    covers venue branding.

## 8. Employment classification

21. **[PRE-SCALE]** Are sellers safely independent contractors (not employees) under
    Colorado law and FLSA given our model: sellers set offerings and prices, we curate,
    take 20%, require proof standards and conduct rules?
    *Why:* misclassification would upend unit economics and add payroll obligations;
    our control (checklists, standards, approval gates) is the risk factor.
    *Provisional:* sellers control the how/when/whether of their activity; we avoid
    scheduling control beyond the booked deliverable; contractor status stated in the
    marketplace agreement (pending counsel language).

## 9. Privacy

22. **[PRE-SCALE]** What do the Colorado Privacy Act (and CCPA if/when we touch
    California residents) require of us at our size: privacy notice contents,
    deletion/access rights workflow, data-sale/sharing analysis for analytics (PostHog
    later), message retention?
    *Why:* we hold PII (emails, names, campaign messages, payout metadata); doc 15 notes
    we have no deletion path by design (audit trail) — counsel must reconcile erasure
    rights vs. audit/financial retention. *Provisional:* minimal PII collected; no data
    sold; first-party analytics only today; redaction-not-deletion proposed as the
    erasure mechanism.
23. **[BLOCKER]** Minors: we are 18+ with an attestation checkbox (`isAtLeast18`). Is
    attestation sufficient at our risk level, and what must we do if sponsored content
    *features* minors (e.g. a family at a park-run) even though all *parties* are adults?
    *Why:* advertising involving children is prohibited category #11; featuring is
    murkier. *Provisional:* activations *directed at* children refused; minors as
    incidental subjects require parental release (Q19 template).

## 10. Trademark & domain

24. **[PRE-SCALE]** Run knockout + full clearance search on "SponsorThis" for our
    classes (advertising/marketplace services, software), US-first; advise on
    registrability (is it too descriptive?) and filing strategy.
    *Why:* D-002 keeps the name provisionally; rebranding after traction is expensive.
    *Provisional:* name flagged PROVISIONAL in canon; fallback candidates scored in
    `11-brand-strategy.md`; no paid brand spend beyond launch basics until cleared.
25. **[PRE-SCALE]** Domain status: **we could not verify domain availability from the
    build environment** (no reliable WHOIS access); nothing has been registered by us as
    of this writing. Please confirm clearance before we register/acquire, so acquisition
    doesn't create a dispute with a senior rights holder.
    *Why:* buying a domain against an existing mark invites a UDRP/§43 fight.
    *Provisional:* all materials use the working name with the D-002 caveat.

---

## Open questions (meta)

- Sequencing: our proposed order is Q1–2 (entity/ToS) → Q5–7 (money flow) → Q9–11
  (poker) → Q13 (FTC) → Q15 (insurance) — counsel should re-order if dependencies differ.
- Budget reality: which of these can be answered in a fixed-fee startup package vs.
  which need specialists (payments, gaming)? We would rather narrow scope than get
  shallow answers on the two BLOCKER clusters (money transmission, gambling adjacency).
