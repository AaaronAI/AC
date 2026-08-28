// Demo seed data for SponsorThis. Everything here is fictional demo content —
// no real companies, people (other than the founder's own example listing), or results.
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { computeFees } from "../src/lib/fees";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo1234";

async function main() {
  // Wipe in dependency order so the seed is re-runnable.
  const tables = [
    "Revision", "ProofSubmission", "Deliverable", "Review", "Message", "Notification",
    "Refund", "Payment", "Payout", "Dispute", "ContentLicense", "Agreement", "Campaign",
    "Proposal", "Brief", "VenueApproval", "Permit", "ListingMedia", "ListingPackage",
    "Listing", "Category", "PayoutAccount", "SellerProfile", "BuyerProfile", "Membership",
    "Organization", "RiskFlag", "ModerationAction", "Referral", "PromoCode",
    "AnalyticsEvent", "AuditLog", "WebhookEvent", "User",
  ];
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${t}"`);
  }

  const password = hashPassword(DEMO_PASSWORD);

  // ---- Users ----
  const admin = await prisma.user.create({
    data: {
      email: "admin@sponsorthis.demo", name: "Demo Admin", passwordHash: password,
      role: "ADMIN", identityStatus: "VERIFIED", isAtLeast18: true,
    },
  });
  const buyerUser = await prisma.user.create({
    data: {
      email: "buyer@sponsorthis.demo", name: "Blake Marketer", passwordHash: password,
      role: "BUYER", identityStatus: "VERIFIED", isAtLeast18: true,
      buyerProfile: { create: { brandName: "Peak Cold Brew (demo brand)", industry: "Beverage" } },
    },
  });
  const buyerUser2 = await prisma.user.create({
    data: {
      email: "agency@sponsorthis.demo", name: "Ari Agency", passwordHash: password,
      role: "BUYER", identityStatus: "VERIFIED", isAtLeast18: true,
      buyerProfile: { create: { brandName: "Foothill Creative (demo agency)", industry: "Agency" } },
    },
  });
  const aaron = await prisma.user.create({
    data: {
      email: "seller@sponsorthis.demo", name: "Aaron C.", passwordHash: password,
      role: "SELLER", identityStatus: "VERIFIED", isAtLeast18: true,
      sellerProfile: {
        create: {
          displayName: "Aaron C.", city: "Denver, CO",
          bio: "Founder demo seller. Poker player, cyclist, and professional maker of sponsorable moments.",
          reliabilityScore: 92, completedCount: 3, responseHours: 4,
          payoutAccount: { create: { status: "ACTIVE", externalId: "mock_acct_aaron" } },
        },
      },
    },
    include: { sellerProfile: true },
  });
  const seller2 = await prisma.user.create({
    data: {
      email: "seller2@sponsorthis.demo", name: "Casey Rider", passwordHash: password,
      role: "SELLER", identityStatus: "PENDING", isAtLeast18: true,
      sellerProfile: {
        create: {
          displayName: "Casey Rider", city: "Denver, CO",
          bio: "Amateur gravel cyclist racing a full Colorado season. (Demo seller.)",
          reliabilityScore: 78, completedCount: 1, responseHours: 9,
          payoutAccount: { create: { status: "ACTIVE", externalId: "mock_acct_casey" } },
        },
      },
    },
    include: { sellerProfile: true },
  });
  const seller3 = await prisma.user.create({
    data: {
      email: "seller3@sponsorthis.demo", name: "Morgan Trail", passwordHash: password,
      role: "SELLER", identityStatus: "VERIFIED", isAtLeast18: true,
      sellerProfile: {
        create: {
          displayName: "Morgan & Biscuit", city: "Denver, CO",
          bio: "Dog walker with a very photogenic golden retriever and a Wash Park route. (Demo seller.)",
          reliabilityScore: 85, completedCount: 2, responseHours: 6,
          payoutAccount: { create: { status: "ACTIVE", externalId: "mock_acct_morgan" } },
        },
      },
    },
    include: { sellerProfile: true },
  });

  // ---- Orgs ----
  const brandOrg = await prisma.organization.create({
    data: {
      name: "Peak Cold Brew (demo brand)", kind: "BRAND", website: "https://example.com",
      memberships: { create: { userId: buyerUser.id, role: "OWNER" } },
    },
  });
  const agencyOrg = await prisma.organization.create({
    data: {
      name: "Foothill Creative (demo agency)", kind: "AGENCY", website: "https://example.com",
      memberships: { create: { userId: buyerUser2.id, role: "OWNER" } },
    },
  });

  // ---- Categories ----
  const cats: Record<string, string> = {};
  for (const [slug, name] of [
    ["people-moments", "People & Moments"],
    ["events-competitions", "Events & Competitions"],
    ["vehicles-objects", "Vehicles & Objects"],
    ["spaces-surfaces", "Spaces & Surfaces"],
    ["challenges-stunts", "Challenges & Stunts"],
    ["trips-performances", "Trips & Performances"],
  ] as const) {
    const c = await prisma.category.create({ data: { slug, name } });
    cats[slug] = c.id;
  }

  const img = (seedName: string, alt: string) => ({
    kind: "IMAGE",
    url: `/demo/${seedName}.svg`,
    alt,
  });

  // ---- Flagship listing: Aaron's poker tournament (D-008) ----
  const poker = await prisma.listing.create({
    data: {
      sellerProfileId: aaron.sellerProfile!.id,
      categoryId: cats["events-competitions"],
      title: "Sponsor Aaron at a $200 Denver Poker Tournament",
      slug: "aaron-denver-poker-tournament",
      pitch: "Put your brand on the felt: exclusive apparel placement, tracked links, and a full content package from a live Denver poker tournament.",
      description: [
        "I'm entering a $200 buy-in No-Limit Hold'em tournament at a Denver-area card room and offering one sponsor the full ride-along.",
        "Your brand goes on my hat or approved apparel (only where the casino and tournament permit branding), with a pre-event announcement, timestamped sponsor photos, short vertical clips, and a post-event recap.",
        "What this is: a placement and content package with documented proof.",
        "What this is not: a gambling stake. No guaranteed impressions, no guaranteed tournament outcome, no share of winnings, and no financial interest in the gambling result. Venue approval is required before branding is confirmed. All content carries a clear paid-sponsorship disclosure.",
      ].join("\n\n"),
      city: "Denver, CO",
      state: "LIVE",
      basePriceCents: 45000,
      audienceEstimate: null,
      audienceEvidence: "No audience estimate offered. Tournament attendance varies; deliverables are placement + content, not reach.",
      venueApprovalRequired: true,
      permitsRequired: false,
      sponsorRestrictions: "No gambling operators, tobacco/nicotine, or categories restricted by the venue. Sponsor has no stake in tournament results.",
      competingExclusions: "Category exclusivity available in the Exclusive Activation package only.",
      cancellationPolicy: "STANDARD",
      proofMethod: "Timestamped photos and video with visible event context; proof-of-completion package delivered before payout release.",
      riskLevel: "MEDIUM",
      customRequestsOpen: true,
      availabilityNote: "Monthly tournament schedule; next entry bookable 3+ weeks out.",
      packages: {
        create: [
          {
            name: "Basic Placement", priceCents: 45000, sortOrder: 0,
            deliverables: [
              "Sponsor funds tournament entry as part of the booking price",
              "Logo placement on hat or approved apparel (venue-permitting)",
              "One pre-event announcement post with clear #sponsored disclosure",
              "Timestamped pre-event sponsor photo",
              "One post-event recap post",
              "Proof-of-completion package",
            ].join("\n"),
            exclusions: "No guaranteed impressions. No share of winnings. No financial interest in the gambling result.",
            exclusivity: "NONE", usageRightsDays: 30,
          },
          {
            name: "Placement + Content", priceCents: 75000, sortOrder: 1,
            deliverables: [
              "Everything in Basic Placement",
              "Three short vertical video clips (15–45s)",
              "Eight edited photos",
              "Tracked link, promo code, or QR placement where permitted",
              "30-day organic content-usage rights",
            ].join("\n"),
            exclusions: "No guaranteed impressions. No share of winnings. No financial interest in the gambling result.",
            exclusivity: "NONE", usageRightsDays: 30,
          },
          {
            name: "Exclusive Activation", priceCents: 150000, sortOrder: 2,
            deliverables: [
              "Everything in Placement + Content",
              "Category exclusivity for the event",
              "Custom pre-event concept collaboration (one revision round)",
              "Extended 60-day organic usage rights",
              "Mini case-study writeup with performance notes",
            ].join("\n"),
            exclusions: "No guaranteed impressions. No share of winnings. No financial interest in the gambling result. Paid-media rights available as an add-on.",
            exclusivity: "CATEGORY", usageRightsDays: 60,
          },
        ],
      },
      media: { create: [img("poker", "Demo image: poker tournament placement")] },
      venueApprovals: {
        create: {
          venueName: "Denver-area card room (TBD)",
          status: "REQUIRED",
          notes: "Branding confirmed only after written venue approval. Fallback: apparel worn outside restricted areas + content package.",
        },
      },
    },
  });

  // ---- Catalog listings ----
  const catalog = [
    {
      seller: seller2.sellerProfile!, cat: "people-moments",
      title: "Sponsor a Gravel Cyclist's Race Season Debut", slug: "gravel-cyclist-race-debut",
      pitch: "Kit placement, race-day story coverage, and finish-line content from a Colorado gravel race.",
      price: 60000, city: "Denver, CO", state: "LIVE", venue: false, permits: false, risk: "MEDIUM",
      proof: "Timestamped race-day photos, GPS ride file, finish-line video.",
      imgSeed: "cyclist", alt: "Demo image: cyclist kit sponsorship",
      packages: [
        { name: "Kit Placement", price: 60000, deliv: "Logo on jersey (race-permitting)\nPre-race announcement with disclosure\nTimestamped race-day photo set\nProof-of-completion package" },
        { name: "Kit + Content", price: 95000, deliv: "Everything in Kit Placement\nThree vertical clips\nSix edited photos\n30-day organic usage rights" },
      ],
    },
    {
      seller: seller3.sellerProfile!, cat: "challenges-stunts",
      title: "Sponsor a Denver Dog-Walking Day in Wash Park", slug: "denver-dog-walking-day",
      pitch: "A branded bandana, a very good dog, and a morning of park content with real foot traffic.",
      price: 35000, city: "Denver, CO", state: "LIVE", venue: false, permits: true, risk: "LOW",
      proof: "Timestamped photos across the route, short clips, route map.",
      imgSeed: "dog", alt: "Demo image: dog walking sponsorship",
      packages: [
        { name: "Bandana Walk", price: 35000, deliv: "Branded bandana + leash wrap for one 2-hour walk\nDisclosure on all posts\nTimestamped photo set\nProof-of-completion package" },
        { name: "Full Morning + Content", price: 65000, deliv: "Everything in Bandana Walk\nTwo walks (morning + evening)\nThree vertical clips\n30-day organic usage rights" },
      ],
    },
    {
      seller: aaron.sellerProfile!, cat: "vehicles-objects",
      title: "Sponsor 100 Branded Bike Commutes", slug: "hundred-branded-bike-commutes",
      pitch: "A month of daily branded bike commutes through downtown Denver with panniers as moving billboards.",
      price: 120000, city: "Denver, CO", state: "LIVE", venue: false, permits: false, risk: "LOW",
      proof: "Daily timestamped departure photos, GPS logs, weekly recap video.",
      imgSeed: "bike", alt: "Demo image: branded bike commute",
      packages: [
        { name: "Full Month", price: 120000, deliv: "Pannier + frame branding on ~100 commute legs over one month\nDisclosure on all posts\nGPS-verified route logs\nWeekly recap content\nProof-of-completion package" },
      ],
    },
    {
      seller: seller3.sellerProfile!, cat: "spaces-surfaces",
      title: "Sponsor a Coffee Cart Takeover Morning", slug: "coffee-cart-takeover",
      pitch: "Your brand on the cups, the cart, and the counter for one high-traffic morning — pending cart-owner approval.",
      price: 90000, city: "Denver, CO", state: "UNDER_REVIEW", venue: true, permits: false, risk: "LOW",
      proof: "Timestamped photos, cup-count log, customer QR scans.",
      imgSeed: "coffee", alt: "Demo image: coffee cart takeover",
      packages: [
        { name: "Morning Takeover", price: 90000, deliv: "Branded cups + cart signage for one 4-hour morning\nQR code on cups\nTimestamped photos\nProof-of-completion package" },
      ],
    },
    {
      seller: seller2.sellerProfile!, cat: "trips-performances",
      title: "Sponsor a 14er Summit Attempt (Content Package)", slug: "fourteener-summit-attempt",
      pitch: "Sunrise summit push on a Colorado 14er with flag photo, gear placement, and trail content.",
      price: 55000, city: "Denver, CO", state: "SUBMITTED", venue: false, permits: false, risk: "MEDIUM",
      proof: "GPS track, timestamped summit photos, trail video.",
      imgSeed: "summit", alt: "Demo image: mountain summit sponsorship",
      packages: [
        { name: "Summit Package", price: 55000, deliv: "Brand flag summit photo (weather-permitting, safety first)\nGear placement during hike\nThree vertical clips\nDisclosure on all posts\nProof-of-completion package" },
      ],
    },
    {
      seller: aaron.sellerProfile!, cat: "events-competitions",
      title: "Sponsor a Convention Attendee for a Weekend", slug: "convention-attendee-weekend",
      pitch: "Branded apparel and daily video diaries from the floor of a major Denver convention — subject to event rules.",
      price: 80000, city: "Denver, CO", state: "DRAFT", venue: true, permits: false, risk: "MEDIUM",
      proof: "Daily timestamped floor photos and video diaries.",
      imgSeed: "convention", alt: "Demo image: convention attendee sponsorship",
      packages: [
        { name: "Weekend Pass", price: 80000, deliv: "Approved apparel branding for 2 days (event-rules permitting)\nDaily video diary\nDisclosure on all posts\nProof-of-completion package" },
      ],
    },
  ];

  const listingBySlug: Record<string, string> = { [poker.slug]: poker.id };
  for (const l of catalog) {
    const created = await prisma.listing.create({
      data: {
        sellerProfileId: l.seller.id,
        categoryId: cats[l.cat],
        title: l.title, slug: l.slug, pitch: l.pitch,
        description: `${l.pitch}\n\nThis is seeded demo content illustrating a realistic listing. Deliverables, restrictions, and proof standards follow the SponsorThis listing structure. All sponsorships carry clear paid-partnership disclosure.`,
        city: l.city, state: l.state, basePriceCents: l.price,
        audienceEvidence: "No audience estimate offered for this demo listing.",
        venueApprovalRequired: l.venue, permitsRequired: l.permits,
        sponsorRestrictions: "No prohibited categories per the SponsorThis policy.",
        cancellationPolicy: "STANDARD", proofMethod: l.proof, riskLevel: l.risk,
        packages: {
          create: l.packages.map((p, i) => ({
            name: p.name, priceCents: p.price, deliverables: p.deliv,
            exclusions: "No guaranteed impressions.", sortOrder: i,
          })),
        },
        media: { create: [img(l.imgSeed, l.alt)] },
        ...(l.venue
          ? { venueApprovals: { create: { venueName: "Venue owner (TBD)", status: "REQUIRED" } } }
          : {}),
        ...(l.permits
          ? { permits: { create: { authority: "City & County of Denver", kind: "Park use / small activation (verify)", status: "REQUIRED" } } }
          : {}),
      },
    });
    listingBySlug[l.slug] = created.id;
  }

  // ---- Brief + proposals (agency demand flow) ----
  const brief = await prisma.brief.create({
    data: {
      orgId: agencyOrg.id,
      objective: "Launch buzz for a client's new trail-running shoe in Denver",
      audience: "Active 25-40 outdoor enthusiasts",
      city: "Denver, CO",
      budgetCents: 300000,
      desiredOutcome: "Three real-world moments with shareable short-form content and tracked links.",
      restrictions: "No gyms, no competing footwear visible, family-friendly only.",
      deliverables: "Vertical video, edited photos, 30-day organic usage rights.",
      status: "PROPOSED",
      targetDate: new Date(Date.now() + 30 * 864e5),
    },
  });
  await prisma.proposal.createMany({
    data: [
      {
        briefId: brief.id, listingId: listingBySlug["gravel-cyclist-race-debut"],
        sellerProfileId: seller2.sellerProfile!.id,
        packageSummary: "Kit + Content package aligned to race weekend",
        priceCents: 95000, status: "SENT",
        notes: "Race-day storyline fits the trail-shoe launch; shoe placement in warm-up segments.",
      },
      {
        briefId: brief.id, listingId: listingBySlug["denver-dog-walking-day"],
        sellerProfileId: seller3.sellerProfile!.id,
        packageSummary: "Full Morning + Content in Wash Park",
        priceCents: 65000, status: "SENT",
        notes: "High-foot-traffic park morning; bandana + leash branding with trail-shoe cameo.",
      },
    ],
  });

  // ---- Campaigns at different lifecycle stages ----
  async function makeCampaign(opts: {
    orgId: string; listingSlug: string; pkgName: string; title: string;
    state: string; withPayment: boolean; payout?: "HELD" | "RELEASED" | "PAID";
    scheduledDays?: number;
  }) {
    const listing = await prisma.listing.findUniqueOrThrow({
      where: { slug: opts.listingSlug },
      include: { packages: true, seller: { include: { payoutAccount: true } } },
    });
    const pkg = listing.packages.find((p) => p.name === opts.pkgName) ?? listing.packages[0];
    const fees = computeFees(pkg.priceCents);
    const campaign = await prisma.campaign.create({
      data: {
        orgId: opts.orgId, listingId: listing.id, packageId: pkg.id,
        title: opts.title, state: opts.state,
        priceCents: pkg.priceCents, buyerFeeCents: fees.buyerFeeCents,
        sellerPayoutCents: fees.sellerPayoutCents, platformFeeCents: fees.platformFeeCents,
        scheduledFor: new Date(Date.now() + (opts.scheduledDays ?? 14) * 864e5),
        deliverables: {
          create: pkg.deliverables.split("\n").map((d, i) => ({
            title: d, sortOrder: i,
            status: opts.state === "COMPLETED" || opts.state === "PAYOUT_RELEASED" ? "ACCEPTED" : "PENDING",
          })),
        },
        agreement: {
          create: {
            text: "DEMO CAMPAIGN AGREEMENT (placeholder — attorney review required before real use). Scope: the deliverables listed on this campaign. Payment: collected at booking; seller payout released after proof acceptance. Cancellation per listing policy. All content carries paid-partnership disclosure.",
            buyerAcceptedAt: opts.withPayment ? new Date() : null,
            sellerAcceptedAt: opts.withPayment ? new Date() : null,
          },
        },
        contentLicense: { create: { scope: "ORGANIC", durationDays: pkg.usageRightsDays } },
      },
    });
    if (opts.withPayment) {
      await prisma.payment.create({
        data: {
          campaignId: campaign.id, externalId: `mock_pi_seed_${campaign.id.slice(-8)}`,
          status: "CAPTURED", amountCents: fees.buyerTotalCents,
          buyerFeeCents: fees.buyerFeeCents, platformFeeCents: fees.platformFeeCents,
          processingFeeCents: fees.processingFeeCents,
        },
      });
      if (listing.seller.payoutAccount) {
        await prisma.payout.create({
          data: {
            campaignId: campaign.id, payoutAccountId: listing.seller.payoutAccount.id,
            amountCents: fees.sellerPayoutCents,
            status: opts.payout ?? "HELD",
            releasedAt: opts.payout && opts.payout !== "HELD" ? new Date() : null,
            paidAt: opts.payout === "PAID" ? new Date() : null,
          },
        });
      }
    }
    return campaign;
  }

  // 1. A completed campaign with proof + review (dog walk, brand org).
  const done = await makeCampaign({
    orgId: brandOrg.id, listingSlug: "denver-dog-walking-day", pkgName: "Bandana Walk",
    title: "Peak Cold Brew × Wash Park dog walk (demo)", state: "COMPLETED",
    withPayment: true, payout: "PAID", scheduledDays: -10,
  });
  const doneProof = await prisma.proofSubmission.create({
    data: {
      campaignId: done.id, url: "/demo/proof-dog.svg",
      caption: "Bandana placement at the Wash Park boathouse, 8:14 AM (demo proof)",
      capturedAt: new Date(Date.now() - 10 * 864e5), status: "ACCEPTED",
    },
  });
  void doneProof;
  await prisma.review.create({
    data: {
      campaignId: done.id, authorId: buyerUser.id, sellerProfileId: seller3.sellerProfile!.id,
      rating: 5, body: "Demo review: proof package arrived same-day and the content was better than briefed.",
    },
  });

  // 2. Proof submitted, awaiting buyer review (bike commutes, agency org).
  const inReview = await makeCampaign({
    orgId: agencyOrg.id, listingSlug: "hundred-branded-bike-commutes", pkgName: "Full Month",
    title: "Client launch: branded commutes week 1 (demo)", state: "PROOF_SUBMITTED",
    withPayment: true, payout: "HELD", scheduledDays: -2,
  });
  await prisma.proofSubmission.create({
    data: {
      campaignId: inReview.id, url: "/demo/proof-bike.svg",
      caption: "Week-1 departure photos with pannier branding, GPS logs attached (demo proof)",
      capturedAt: new Date(Date.now() - 1 * 864e5), status: "SUBMITTED",
    },
  });

  // 3. Booked, pre-production (poker, brand org) — the flagship demo.
  await makeCampaign({
    orgId: brandOrg.id, listingSlug: "aaron-denver-poker-tournament", pkgName: "Placement + Content",
    title: "Peak Cold Brew poker night (demo)", state: "PRE_PRODUCTION",
    withPayment: true, payout: "HELD", scheduledDays: 21,
  });

  // 4. Disputed campaign for the admin demo (cyclist, brand org).
  const disputed = await makeCampaign({
    orgId: brandOrg.id, listingSlug: "gravel-cyclist-race-debut", pkgName: "Kit Placement",
    title: "Race kit test (demo dispute)", state: "DISPUTED",
    withPayment: true, payout: "HELD", scheduledDays: -5,
  });
  await prisma.dispute.create({
    data: {
      campaignId: disputed.id, openedBy: buyerUser.id,
      reason: "Demo dispute: logo placement photographed but pre-race announcement post was never made.",
      status: "OPEN",
    },
  });

  // ---- Misc: referral, promo, audit, analytics ----
  await prisma.referral.create({
    data: { referrerId: buyerUser.id, code: "PEAK250", creditCents: 25000 },
  });
  await prisma.promoCode.create({
    data: { code: "DENVERLAUNCH", percentOff: 10, maxUses: 20 },
  });
  await prisma.auditLog.createMany({
    data: [
      { actorId: admin.id, action: "listing.UNDER_REVIEW->APPROVED", entityType: "LISTING", entityId: poker.id, detail: "Seed: flagship listing approved" },
      { actorId: admin.id, action: "campaign.seed", entityType: "CAMPAIGN", entityId: done.id, detail: "Seed: demo lifecycle data" },
    ],
  });
  await prisma.analyticsEvent.createMany({
    data: [
      { name: "listing_viewed", props: JSON.stringify({ slug: poker.slug }) },
      { name: "brief_submitted", userId: buyerUser2.id },
      { name: "checkout_completed", userId: buyerUser.id },
    ],
  });
  await prisma.riskFlag.create({
    data: {
      entityType: "LISTING", entityId: listingBySlug["fourteener-summit-attempt"],
      severity: "MEDIUM", reason: "Altitude/weather safety plan required before approval (seed flag).",
    },
  });

  console.log("Seed complete.");
  console.log("Demo accounts (password for all: %s)", DEMO_PASSWORD);
  console.log("  admin@sponsorthis.demo  (ADMIN)");
  console.log("  buyer@sponsorthis.demo  (BUYER — Peak Cold Brew)");
  console.log("  agency@sponsorthis.demo (BUYER — Foothill Creative)");
  console.log("  seller@sponsorthis.demo (SELLER — Aaron)");
  console.log("  seller2@sponsorthis.demo / seller3@sponsorthis.demo (SELLERs)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
