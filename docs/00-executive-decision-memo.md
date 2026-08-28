# 00 · Executive Decision Memo — SponsorThis

**Date:** 2026-08-28 · **Status:** GO (conditional — see economic test and kill criteria)
**Canon:** All numbers conform to `DECISIONS.md` (D-001…D-020) and `ASSUMPTIONS.md`.
**Author posture:** operator memo, not a pitch. Skepticism is a feature.

---

## 1. Thesis

Brands buy attention. Almost all of the packaged, buyable attention supply is digital
(paid social, influencer posts) or industrial (billboards, event sponsorships at
$25k+ minimums). Between those poles sits an enormous, unpackaged long tail of
**real-world sponsorable inventory** — a person entering a poker tournament, a dog-walking
day, a vehicle, a storefront window, a 100-ride bike-commute series — that no platform
today makes **lawful, consensual, packagable, and provable**. SponsorThis packages that
inventory as **verified sponsorable moments**: fixed-price packages with defined
deliverables, venue approval, rights, and timestamped proof, sold to brands and agencies.

We are not selling "exposure." We are selling a produced micro-activation plus a content
package plus proof of completion — at $450–$5,000, two orders of magnitude below what an
experiential agency charges for the same category of outcome (small activations
commonly start at $10k–$50k; see `01-market-and-competitor-research.md`).

## 2. Why now

- **FACT:** Influencer marketplaces normalized brands paying individuals $100–$500+ for a
  single piece of sponsored content (sources in doc 01). The behavioral leap from
  "sponsor a post" to "sponsor a moment, and get the post *plus* the real-world placement"
  is small.
- **FACT:** Self-serve ad marketplaces (Blip for billboards, Collabstr for creators)
  proved that previously agency-gated inventory sells at low price points when packaging
  and checkout friction are removed.
- **HYPOTHESIS:** Digital CACs and ad fatigue push consumer brands toward
  distinctive, shareable real-world activations; the only current options are DIY (high
  effort) or agencies (high minimums). Unverified but consistent with buyer behavior we
  will test in interviews.
- **Structural gap (FACT by absence):** we found no platform selling verified,
  proof-backed, long-tail real-world sponsorships at sub-$5k price points (doc 01,
  competitor scan of 12+ platforms).

## 3. Strategy: managed marketplace first (D-001)

We launch as a **managed marketplace and activation studio**, not an open marketplace.
Supply hand-curated, demand founder-sold, fulfillment concierge-operated behind real
software (booking, payment, state machine, proof, reporting). Self-serve unlocks only
after ≥10 completed paid campaigns and ≥3 repeat buyers.

Why: open marketplaces die of cold-start in novel categories. A managed motion collects
cash in weeks, generates the pricing data and case studies that self-serve later needs,
and lets us learn the ops cost curve before we promise scale.

## 4. Wedge (D-003, D-004)

**Denver, verified sponsorable moments.** One city, dense founder network, permissive
event culture, ~450+ annual festivals (estimate, doc 01), low venue cost. Buyer priority:
(1) marketing/creative agencies, (2) consumer startups & DTC, (3) local Denver businesses.
Seed listing: the $200 poker-tournament sponsorship (D-008) — deliberately odd, cheap to
fulfill, media-worthy, and a live demonstration of the whole category.

## 5. Revenue model summary (D-005/D-006/D-007)

| Stream | Terms | Status |
|---|---|---|
| Self-serve bookings | 20% platform fee from seller payout + 5% buyer fee; $250 min package; processing absorbed by platform | Live at launch (concierge-assisted) |
| Managed campaigns | All-in pricing, 35–50% gross margin target; $1,500 minimum; pass-throughs +15% coordination; rush +20% | Primary revenue engine, months 1–6 |
| Subscriptions ($299–$499/mo) and auctions | — | DEFERRED (D-007) until 3 repeat buyers |

Worked anchor (D-005): $750 package → buyer pays $787.50, seller gets $600.00, platform
gross $187.50, net ≈ $162.61 before labor. Full unit economics in `05-unit-economics.md`.

## 6. 30-day goal (D-010)

**3–5 paid campaigns · ≥ $5,000 cash collected · ≥ $1,500 contribution margin.**
Cash collected outranks GMV. Signups, listings, and followers are explicitly not success
metrics (D-009). The base scenario in `21-financial-scenarios.md` clears this with 4
managed campaigns at ~$2,200 AOV; the conservative scenario misses it — which is exactly
what the kill criteria are for.

## 7. Top 5 risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **Willingness to pay is imaginary** — brands like the idea, won't sign POs (A-01) | Existential | 20 buyer interviews + founder-sold pilots in 30 days; kill gate at <2 paid campaigns per 100 qualified contacts |
| 2 | **Ops labor eats margin** — concierge hours stay at 8h/campaign (A-07) | High | Time-track every campaign; templatize proof/permits; gate self-serve on labor ≤6h by campaign #10 |
| 3 | **Venue/legal friction** — venues refuse branding, permits slow, gambling-adjacency (A-06, A-12, A-15) | High | Venue approval is a listing precondition, not an afterthought; attorney review before Tier-3 poker sale; diversify inventory away from venue-dependent listings |
| 4 | **Unmeasurable ROI vs. paid social** — CFOs ask "what's the CPM?" | Medium-high | Sell proof + content output (usable assets), not impressions; never promise impressions (D-008 constraint); target buyers who value distinctiveness and content, not last-click ROAS |
| 5 | **Cold-start liquidity** — 2-sided chicken-and-egg | Medium (by design) | Managed model removes it at launch: we ARE the liquidity; supply hand-curated (25–50 listings), demand founder-sold |

## 8. Red team: why this fails

Steelmanned, in order of probability:

1. **Low willingness to pay.** Brands already buy attention at ~$5–$15 CPM digitally with
   attribution. A $750 poker patch with "no guaranteed impressions" is, on a spreadsheet,
   a terrible media buy. If buyers evaluate us as media, we lose. *Counter:* we sell it as
   content production + activation + story, where the comparable is a $150–$500
   micro-influencer post (which also has soft ROI) or a $10k+ agency activation — not a
   CPM. If interviews show buyers still force the CPM frame, that falsifies A-01 and we
   stop.
2. **Ops labor eats margin.** At 8 concierge hours ($320) per $1,500 campaign, we run a
   services shop with marketplace branding. *Counter:* D-006 prices managed campaigns at
   35–50% GM including that labor; the leverage curve (doc 05) must show hours falling
   toward 2h. If A-07 falsifies (>10h with no downward trend), the model doesn't scale
   and we say so.
3. **Unmeasurable ROI.** No third-party measurement exists for a sponsored dog walk.
   *Counter:* proof packages (timestamped photos, video, usage-rights content) convert
   the buy into an asset purchase; D-009 tracks whether proof drives repeat (A-10).
4. **Legal/venue friction.** Every listing touches property rights, permits, disclosure
   rules; poker touches gambling law. *Counter:* T&S is launch-blocking (D-016), venue
   approval is a package precondition, counsel review is scheduled
   (`LEGAL-REVIEW-QUESTIONS.md`), and inventory taxonomy (doc 02) explicitly excludes
   unlawful/unconsented categories. Friction is also our moat: it's why no aggregator
   has packaged this inventory.
5. **Cold-start liquidity.** *Counter:* the managed posture converts a marketplace
   cold-start into a services sales problem, which one founder can brute-force. The real
   risk transfers to risk #2 (labor), which is measurable weekly.

**Why we proceed anyway:** every failure mode above is cheap to test. The entire
experiment — 30 days, founder time, <$1,500 in tools/CAC/insurance cash — buys a
definitive read on A-01 (willingness to pay), the single existential assumption. The
downside is bounded and known; the upside is a category.

## 9. GO recommendation and the economic test

**Recommendation: GO**, conditional on passing this test by day 30:

> **The economic test:** ≥3 paid campaigns, ≥$5,000 cash collected, ≥$1,500 contribution
> margin (D-008 convention: platform revenue − processing − payout fees − direct labor,
> before reserves/overhead), and at least one campaign at ≤6 concierge hours.
> Additionally, ≥1 buyer must state intent to rebook (repeat intent is metric #2, D-009).

If passed → continue toward the 10-campaign / 3-repeat-buyer self-serve gate (D-001).
If failed → apply kill/pivot criteria below. We do not extend the test with "one more
month" reasoning unless ≥2 campaigns closed and pipeline shows ≥5 signed proposals.

## 10. Kill criteria summary (full version: `23-kill-pivot-continue-criteria.md`)

- **KILL** if: <2 paid campaigns after 100 qualified outbound contacts (falsifies A-01);
  or all approached venues refuse visible branding (falsifies A-12 + signals A-06);
  or counsel says the money flow or poker structure is unlawful and unfixable (A-13, A-15).
- **PIVOT** if: buyers pay but only for content output → pivot toward UGC-with-real-world-
  backdrop production; or only agencies buy at $5k+ → pivot to agency-services wedge;
  or labor >10h/campaign with no trend → raise minimums, cut inventory types.
- **CONTINUE** if: economic test passed and repeat intent exists.

## Open questions

1. Does the D-010 contribution goal use the D-008 convention (before reserves) or the
   fully-loaded doc-05 template? This memo assumes D-008 convention; confirm and record
   in DECISIONS.md if disputed.
2. Who is the named attorney for A-13/A-15 review, and is the review complete before we
   sell poker Tier 3 or only before payout release?
3. Is founder living cost inside or outside "founder cash need" in doc 21? (Doc 21
   models it explicitly as outside contribution margin; confirm runway math.)
