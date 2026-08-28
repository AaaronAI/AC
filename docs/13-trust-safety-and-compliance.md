# 13 · Trust, Safety & Compliance Program

Canon: D-016 (T&S is launch-blocking), D-008 (poker listing constraints), D-013 (payments/no
"escrow" language), D-015 (state machines), D-020 (honesty constraints). Implementation
references are to the real code in `/app` (Prisma schema, `src/lib/*`). Where a control is
policy-only (not yet enforced in code), it is marked **[POLICY — enforced by admin process,
not code]**. Nothing in this document is legal advice; open legal items are queued in
`LEGAL-REVIEW-QUESTIONS.md`.

---

## 1. Age requirement: 18+ only

- All users — buyers, sellers, org members — must be 18 or older at launch. No exceptions,
  no "with parental consent" path.
- Implementation: `User.isAtLeast18` (Boolean, default `false`) in `prisma/schema.prisma`.
  Signup must set it via an explicit attestation checkbox; accounts without it cannot
  publish listings or book campaigns. **[POLICY — attestation UI is part of the signup flow
  spec; the schema field exists today, the gating checks ship with the signup/booking routes.]**
- Rationale: sellers are contracting parties and payees; minors cannot validly contract,
  and marketing involving minors triggers COPPA-adjacent and endorsement-law complexity
  we are explicitly not building for (see Prohibited Categories #14).

## 2. Identity verification tiers

`User.identityStatus`: `UNVERIFIED → PENDING → VERIFIED` (string pseudo-enum on SQLite;
see `15-data-model.md`).

| Tier | How reached | What it unlocks |
|---|---|---|
| `UNVERIFIED` | Default at signup | Browse, message support, draft listings (sellers), submit briefs (buyers). Nothing that moves money or goes public. |
| `PENDING` | User submits verification info; admin reviews (concierge-manual at launch) | Listing may enter `SUBMITTED`/`UNDER_REVIEW`; proposals may be drafted. Still cannot go `LIVE` or receive payouts. |
| `VERIFIED` | Admin approves (launch: founder checks government ID + selfie match + social/web presence manually; production: Stripe Identity or Connect onboarding doubles as verification) | Listings can be approved/`LIVE`; seller can receive payouts; buyer orgs can complete checkout above $1,000. |

**[POLICY]** The tier gates above are the operating rule for the concierge launch; the
schema field exists and admin moderation is where the gate is applied. Automated
enforcement in route handlers ships with those routes.

## 3. Payment and payout verification

- **Buyers:** card authorization + capture at checkout (`chargeForCampaign` in
  `src/lib/payments.ts`) is itself a verification signal; failed/declined cards never create a
  booked campaign (`Payment.status = FAILED` blocks progression).
- **Sellers:** `PayoutAccount.status`: `ONBOARDING → ACTIVE` (or `RESTRICTED`). No payout
  is released to a non-`ACTIVE` account. In production this maps to Stripe Connect Express
  onboarding (KYC handled by Stripe); today the mock provider stands in (D-013).
- **W-9 / tax:** collected from sellers before first payout **[POLICY — no schema field yet;
  see LEGAL-REVIEW-QUESTIONS.md §2 for 1099 thresholds]**.

## 4. Mandatory paid-sponsorship disclosure (FTC)

Every piece of sponsored content produced through SponsorThis — posts, signage captions,
livestreams, verbal mentions — must clearly and conspicuously disclose the paid
relationship. This is non-negotiable and is written into every campaign's deliverable
checklist.

Basis (verifiable external guidance):

- The FTC's Endorsement Guides, 16 CFR Part 255 (revised June 2023), require clear and
  conspicuous disclosure of any "material connection" between an endorser and a brand —
  including monetary payment — whenever the audience would not reasonably expect it.
  Disclosures must be made in the same medium as the endorsement (visual claims need
  visual disclosure; audio claims need audio disclosure).
  Source: https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255
- The FTC's plain-language guide "Disclosures 101 for Social Media Influencers" says
  disclosures should be placed up front where followers will immediately see them; terms
  like "ad," "advertisement," "sponsored," `#ad`, `#sponsored` work; burying the disclosure
  in a string of hashtags or behind "more" does not.
  Source: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers

Our operating rules:

1. Disclosure language is a **required deliverable** on every campaign (a `Deliverable` row,
   e.g. "All posts carry #ad in the first line"), so proof review checks it before payout.
2. Physical activations (poker table, race kit, coffee cart) must carry visible "Sponsored
   by X" or "#ad" treatment where the placement itself doesn't make the paid relationship
   obvious, and any accompanying social content discloses regardless.
3. Proof reviewers reject proof (`ProofSubmission.status = REVISION_REQUESTED`) if
   disclosure is missing, illegible, or buried. Payout is never released on undisclosed content.
4. Repeat violations create a `RiskFlag` on the seller and can lead to `ModerationAction`
   `PAUSE`/`BAN`.
5. Assumption A-14 (checklist enforcement is operationally sufficient) is tracked; repeated
   violations found in proof review falsify it and trigger program redesign.

## 5. Venue approval workflow

Venue approval is first-class in the data model, not a notes field:

- `Listing.venueApprovalRequired` (Boolean) — set at listing creation; moderators verify
  it is set truthfully for any listing occurring on property the seller does not control.
- `VenueApproval` rows per listing: `venueName`, `status ∈ REQUIRED | REQUESTED |
  APPROVED | DENIED`, `notes`, `updatedAt`.

Workflow:

1. Moderation will not move a venue-dependent listing past `UNDER_REVIEW` without at
   least one `VenueApproval` row (`REQUIRED` at minimum) naming the venue.
2. A campaign on such a listing cannot leave `APPROVAL_PENDING` for `IN_PROGRESS` until
   every relevant `VenueApproval.status = APPROVED` (this is exactly what the
   `APPROVAL_PENDING → IN_PROGRESS` admin-only transition in `state-machines.ts` exists
   for; `APPROVAL_PENDING → PRE_PRODUCTION` is the "approval denied, re-plan" path).
3. Written evidence (email from venue, signed one-pager) is stored in `notes`/linked and
   referenced in the audit log. Verbal approval is not approval.
4. The admin queue view over `VenueApproval` rows in non-terminal statuses is part of the
   admin UI build **[POLICY — model and state transitions exist; the queue page ships with
   the admin UI]**.
5. D-008 constraint restated: the poker listing confirms **no branding until the casino/
   card room approves in writing**; Tier 3 is not sold before approval (Assumption A-12).

## 6. Permit workflow

Same pattern via the `Permit` model: `authority`, `kind`, `status ∈ REQUIRED | FILED |
GRANTED | DENIED`, `notes`.

- Listings set `Listing.permitsRequired` when any public-space, street, park, amplified-
  sound, or assembly component exists.
- Campaigns requiring permits sit in `APPROVAL_PENDING` until all `Permit.status =
  GRANTED`. We never run an activation on a filed-but-not-granted permit.
- Denver reference points (verify per event with the Office of Special Events,
  DenverEvents@DenverGov.org): street/sidewalk/plaza use needs a Special Event Revocable
  Street Occupancy Permit via DOTI; park events need a preliminary park permit before the
  OSE application, with park requirements due ≥21 days before setup; Denver Fire wants
  ≥30 days notice.
  Source: https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Office-of-Special-Events/Permitting-Special-Events
- Assumption A-16 (permits < 2 weeks, < $200) is rated **Low confidence** and is tested by
  filing one real permit during the pilot.

## 7. Content releases and usage rights

- Every campaign has an optional `ContentLicense` (`scope ∈ ORGANIC | PAID_MEDIA`,
  `durationDays` default 30, `startsAt`) and every `ListingPackage` carries
  `usageRightsDays` (default 30). Buyers get exactly what the license says — organic reuse
  for the stated window unless `PAID_MEDIA` was purchased.
- The `Agreement` model (one per campaign, versioned text, `buyerAcceptedAt` /
  `sellerAcceptedAt` timestamps) records both parties' acceptance of the campaign terms,
  including the license, disclosure obligation, and cancellation policy. Whether this
  click-through acceptance flow is sufficiently enforceable is a counsel question
  (`LEGAL-REVIEW-QUESTIONS.md` §1).
- Sellers warrant they have releases from identifiable people appearing in deliverables and
  rights to any third-party material **[POLICY — warranty lives in the agreement text;
  release-file uploads are a production feature]**.

## 8. Buyer & seller conduct standards

**Sellers must:** deliver what the package says; show up on time; carry required
approvals/permits; disclose sponsorship; submit honest, unedited, timestamped proof;
keep response times reasonable (`SellerProfile.responseHours` is tracked); never solicit
off-platform payment for platform-sourced buyers.

**Buyers must:** not request anything in the prohibited list; not demand undisclosed
advertising; not use revision requests to extract unpaid extra work (revisions are scoped
to the agreed deliverables); not contact sellers to move the deal off-platform; treat sellers
respectfully in `Message` threads (all campaign messaging is on-platform and retained).

Violations by either side produce `RiskFlag` rows and `ModerationAction`s
(`PAUSE`/`BAN`), all audit-logged.

## 9. Timestamped-proof standards

Payout is never released without accepted proof (D-016). A valid `ProofSubmission`:

- has `capturedAt` (when the moment happened) distinct from `submittedAt` (when
  uploaded) — both are real schema fields;
- includes original, unedited capture (photo/video) with visible context: the branding, the
  place, and where feasible something that anchors time (event signage, tournament clock,
  screen);
- maps to a specific `Deliverable` (`deliverableId`) so acceptance is per-promise, not
  vibes;
- for content deliverables, includes the live URL plus a screen capture (links rot).

Reviewers may request the original file with metadata for spot checks. Doctored or
recycled proof is fraud: immediate `RiskFlag` (HIGH), payout hold, and ban review.

## 10. Fraud review signals

Signals that create `RiskFlag` rows for admin review (launch: founder-manual, informed by
these heuristics; production: partially automated):

- new buyer + high order value + rush timeline (card-fraud pattern);
- mismatch between card country/name and org identity;
- seller submitting proof implausibly fast, or `capturedAt` before campaign `BOOKED`;
- reused/duplicate proof media across campaigns;
- either party pushing for off-platform payment or communication;
- multiple accounts sharing payout accounts or devices;
- listings with audience claims lacking `audienceEvidence` (D-020 requires evidence or
  "no estimate provided");
- refund/dispute frequency per buyer org or per seller above cohort norms.

## 11. Dispute procedure

Tied directly to the `DISPUTED` state and refund paths in `src/lib/state-machines.ts` and
`src/lib/payments.ts`:

1. **Open.** Buyer (or admin) transitions the campaign to `DISPUTED` — legal from
   `BOOKED`, `PRE_PRODUCTION`, `APPROVAL_PENDING`, `IN_PROGRESS`, `PROOF_SUBMITTED`,
   `BUYER_REVIEW`, `REVISION_REQUESTED` (sellers can also open from
   `REVISION_REQUESTED`). A `Dispute` row is created (one per campaign, `campaignId`
   unique): `openedBy`, `reason`, `status = OPEN`.
2. **Freeze.** Payout stays `HELD` (payouts only release from `ACCEPTED →
   PAYOUT_RELEASED`, an admin-only transition, so a disputed campaign cannot pay out).
3. **Evidence window.** Both parties get 5 business days to submit evidence via campaign
   `Message`s and proof records. Admin may request originals.
4. **Decision by admin** (launch: founder; two-person review once staffed), within 5
   business days of evidence close, recorded on the `Dispute`:
   - `RESOLVED_REFUND` → campaign `DISPUTED → REFUNDED`; `refundCampaign()` refunds
     the full captured amount (price + buyer fee) and cancels the `HELD` payout.
   - `RESOLVED_PARTIAL` → partial refund via `refundCampaign()` (payment becomes
     `PARTIALLY_REFUNDED`); remainder proceeds per the resolution; resolution text
     documents the split.
   - `RESOLVED_RELEASE` → campaign `DISPUTED → ACCEPTED` (resolved in seller's favor),
     then the normal `ACCEPTED → PAYOUT_RELEASED → COMPLETED` path.
5. **Record.** Every transition and the resolution rationale land in `AuditLog`;
   `resolvedAt` is set. Card-network chargebacks arriving via the processor are handled as
   disputes with the processor's timeline taking precedence.

## 12. Refund & cancellation rules

- Per-listing `cancellationPolicy ∈ STANDARD | FLEXIBLE | STRICT`, shown before checkout.
  Launch defaults **[POLICY]**: FLEXIBLE = full refund until 48h before the moment;
  STANDARD = full refund until 7 days before, 50% inside 7 days; STRICT = refundable only
  for seller non-delivery. Seller no-show or non-delivery = 100% refund including buyer fee,
  regardless of policy.
- Code paths: admin can cancel/refund pre-execution (`PAYMENT_AUTHORIZED|BOOKED|
  PRE_PRODUCTION → REFUNDED`); `refundCampaign` enforces refund ≤ captured amount,
  tracks partials, and cancels held payouts on full refund.
- Refunds after payout release are a platform-funded exposure (negative-balance risk) —
  see `14-technical-architecture.md` §Payments; reserve assumption A-09 (5% of GMV).

## 13. Audit logging

`AuditLog` captures: `actorId` (nullable for system actions), `action` (e.g.
`campaign.BUYER_REVIEW->ACCEPTED`), `entityType`, `entityId`, optional `detail`,
`createdAt`. Every campaign state change goes through `transitionCampaign()`
(`src/lib/campaigns.ts`), which asserts the transition, writes the audit row, and notifies
counterparties — route handlers never mutate `state` directly. Moderation actions,
payments, refunds, and payout releases are audited under the same pattern.

## 14. Human moderation for novel activations

Any activation type we have not run before — any listing that is not a close variant of an
already-approved template — gets human review before approval, regardless of automated
checks (D-016). The reviewer walks a written checklist: physical risk, bystander exposure,
venue/permit posture, disclosure plan, insurance need, brand-safety scenario ("how does
this look in a bad screenshot"). Verdict and notes are recorded as a `ModerationAction`.
There is no auto-approval path in the MVP at all — every listing approval is a human
`ADMIN` action in the state machine.

---

## 15. Prohibited & Restricted Category Policy

Enforced at listing moderation (`UNDER_REVIEW → REJECTED`) and continuously (a `LIVE`
listing or in-flight campaign found in violation is paused/killed and refunded). One-line
rationale per category:

**Prohibited outright (no exception process):**

1. **Illegal activities** — we will not monetize or facilitate law-breaking, full stop.
2. **Dangerous challenges** — activations with material risk of injury to participants or
   bystanders create liability we are not insured or staffed to manage.
3. **Weapons** — firearms/weapon promotion carries regulatory, platform-payments, and
   brand-safety risk far exceeding any revenue.
4. **Hate or extremist content** — attacks on protected classes or extremist promotion is
   incompatible with a marketplace built on real people in public spaces.
5. **Sexual services** — sexual services and sexually explicit activations are illegal in
   part, unbankable (processor rules), and off-mission.
6. **Harassment** — activations that target, shame, or surveil any individual or group
   weaponize sponsorship against people.
7. **Controlled substances** — federal illegality (including cannabis, legal in CO but
   federally scheduled and processor-prohibited) makes this unpayable and unpromotable.
8. **Misleading health claims** — unsubstantiated health/medical claims are FTC/FDA
   violations we would be amplifying for money.
9. **Financial promises** — guaranteed-return, get-rich, or unregistered-securities
   promotion is a securities/consumer-protection minefield.
10. **Deceptive endorsements** — undisclosed ads, fake reviews, or scripted "authentic"
    reactions violate 16 CFR Part 255 and destroy the trust the marketplace sells.
11. **Advertising directed at children** — child-directed advertising triggers COPPA and
    heightened FTC scrutiny; we are 18+ end-to-end and have no compliance apparatus
    for it.

**Restricted (prohibited by default; documented exception possible — see §16):**

12. **Tobacco / nicotine** — age-gated, heavily regulated ad category (state and federal);
    default no, and no exception at launch while we lack age-verified audience controls.
13. **Unlicensed gambling promotions** — promoting gambling without required licensing
    exposes us and sellers to state gaming enforcement; the D-008 poker listing is a
    *sponsorship of a player with no stake in gambling outcomes*, structured under the
    exception process below, not a gambling promotion.
14. **Political advertising** — until dedicated compliance exists (disclaimers,
    disclosure/reporting rules vary by jurisdiction) we cannot run political ads correctly,
    so we don't run them at all.
15. **Unapproved third-party IP** — logos, characters, event marks, or music the seller
    has no license to use invite infringement claims against sellers, buyers, and us;
    exception requires written license.
16. **Activities violating venue/event/city rules** — an activation that breaks the host
    venue's or city's rules is a trespass/eviction/permit-revocation risk and burns the local
    relationships supply depends on; exception requires the rule-holder's written approval
    (which converts it into an approved activity).

### 16. Restricted-category exception process

1. Seller (or the concierge team on their behalf) files a written exception request on the
   listing: category, exactly what is proposed, why it does not carry the underlying risk.
2. Admin review against a written checklist for that category (for the poker listing:
   fixed placement fee only; no share of winnings; no financial interest in the gambling
   result; no guaranteed impressions; venue's written approval; disclosure plan — the
   D-008 constraints verbatim).
3. Counsel review where the category touches regulation (gambling, IP licenses).
4. If granted: the approval, its scope, and its conditions are recorded as a
   `ModerationAction` with notes plus `AuditLog` entries; the listing's
   `sponsorRestrictions` field carries the binding conditions; `riskLevel` is set `HIGH`.
5. Any deviation from conditions mid-campaign = immediate pause + dispute-style review.
6. Exceptions are per-listing, non-precedential, and expire if the listing materially changes.

## 17. Why we never call buyer protection "escrow"

We describe the money flow as: *the buyer's payment is captured to the platform account,
and the seller's payout is released after proof acceptance.* We never use the word
"escrow" in product, marketing, or contracts because "escrow" implies a regulated legal
arrangement — in many states escrow agents require licensing, and claiming escrow
protection we don't legally provide would itself be a deceptive claim. Whether our actual
flow (capture-then-release on Stripe Connect) creates money-transmission exposure is an
open counsel question (Assumption A-13, `LEGAL-REVIEW-QUESTIONS.md` §2); until
answered, precise language is the cheapest risk control we have.

---

## Open questions

- Counsel sign-off on the dispute→refund procedure interacting with card-network
  chargeback timelines (which one governs when both are open).
- Insurance requirements per risk tier: at what `riskLevel` do we require sellers to carry
  GL insurance or add us as additional insured? (Queued in `LEGAL-REVIEW-QUESTIONS.md` §5.)
- Whether `VERIFIED` at launch should additionally require a payout-account match check
  (name on payout account = name on ID) before the first payout, or only above a threshold.
- Where release files (bystander/participant releases) live before file upload
  infrastructure exists — current answer is the concierge drive, referenced from
  `VenueApproval.notes`/`Agreement.text`, which is weak.
