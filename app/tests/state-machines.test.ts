import { describe, expect, it } from "vitest";
import {
  assertCampaignTransition,
  assertListingTransition,
  campaignTransitionsFrom,
  canTransitionCampaign,
  canTransitionListing,
  CAMPAIGN_STATES,
  LISTING_STATES,
  TransitionError,
} from "@/lib/state-machines";

describe("listing state machine", () => {
  it("follows the happy path draft → live", () => {
    expect(canTransitionListing("DRAFT", "SUBMITTED", "SELLER")).toBe(true);
    expect(canTransitionListing("SUBMITTED", "UNDER_REVIEW", "ADMIN")).toBe(true);
    expect(canTransitionListing("UNDER_REVIEW", "APPROVED", "ADMIN")).toBe(true);
    expect(canTransitionListing("APPROVED", "LIVE", "SELLER")).toBe(true);
  });

  it("supports the changes-requested loop", () => {
    expect(canTransitionListing("UNDER_REVIEW", "CHANGES_REQUESTED", "ADMIN")).toBe(true);
    expect(canTransitionListing("CHANGES_REQUESTED", "SUBMITTED", "SELLER")).toBe(true);
  });

  it("blocks sellers from self-approving", () => {
    expect(canTransitionListing("SUBMITTED", "UNDER_REVIEW", "SELLER")).toBe(false);
    expect(canTransitionListing("UNDER_REVIEW", "APPROVED", "SELLER")).toBe(false);
    expect(canTransitionListing("UNDER_REVIEW", "REJECTED", "SELLER")).toBe(false);
  });

  it("blocks buyers from moderating", () => {
    for (const from of LISTING_STATES) {
      expect(canTransitionListing(from, "APPROVED", "BUYER")).toBe(false);
      expect(canTransitionListing(from, "REJECTED", "BUYER")).toBe(false);
    }
  });

  it("has no transitions out of REJECTED", () => {
    for (const to of LISTING_STATES) {
      for (const role of ["BUYER", "SELLER", "ADMIN"] as const) {
        expect(canTransitionListing("REJECTED", to, role)).toBe(false);
      }
    }
  });

  it("assert throws a 409-style error on illegal moves", () => {
    expect(() => assertListingTransition("DRAFT", "LIVE", "SELLER")).toThrow(TransitionError);
  });
});

describe("campaign state machine", () => {
  it("follows the full happy path to completion", () => {
    const path: [string, string, "BUYER" | "SELLER" | "ADMIN"][] = [
      ["BRIEF_SUBMITTED", "MATCHING", "ADMIN"],
      ["MATCHING", "PROPOSALS_AVAILABLE", "ADMIN"],
      ["PROPOSALS_AVAILABLE", "OFFER_PENDING", "BUYER"],
      ["OFFER_PENDING", "PAYMENT_AUTHORIZED", "BUYER"],
      ["PAYMENT_AUTHORIZED", "BOOKED", "BUYER"],
      ["BOOKED", "PRE_PRODUCTION", "SELLER"],
      ["PRE_PRODUCTION", "APPROVAL_PENDING", "SELLER"],
      ["APPROVAL_PENDING", "IN_PROGRESS", "ADMIN"],
      ["IN_PROGRESS", "PROOF_SUBMITTED", "SELLER"],
      ["PROOF_SUBMITTED", "BUYER_REVIEW", "BUYER"],
      ["BUYER_REVIEW", "ACCEPTED", "BUYER"],
      ["ACCEPTED", "PAYOUT_RELEASED", "ADMIN"],
      ["PAYOUT_RELEASED", "COMPLETED", "ADMIN"],
    ];
    for (const [from, to, role] of path) {
      expect(
        canTransitionCampaign(from as never, to as never, role),
        `${from} → ${to} as ${role}`,
      ).toBe(true);
    }
  });

  it("supports the revision loop", () => {
    expect(canTransitionCampaign("BUYER_REVIEW", "REVISION_REQUESTED", "BUYER")).toBe(true);
    expect(canTransitionCampaign("REVISION_REQUESTED", "PROOF_SUBMITTED", "SELLER")).toBe(true);
  });

  it("only admins release payouts and resolve disputes", () => {
    expect(canTransitionCampaign("ACCEPTED", "PAYOUT_RELEASED", "BUYER")).toBe(false);
    expect(canTransitionCampaign("ACCEPTED", "PAYOUT_RELEASED", "SELLER")).toBe(false);
    expect(canTransitionCampaign("DISPUTED", "REFUNDED", "BUYER")).toBe(false);
    expect(canTransitionCampaign("DISPUTED", "REFUNDED", "ADMIN")).toBe(true);
    expect(canTransitionCampaign("DISPUTED", "ACCEPTED", "ADMIN")).toBe(true);
  });

  it("sellers cannot accept their own proof", () => {
    expect(canTransitionCampaign("BUYER_REVIEW", "ACCEPTED", "SELLER")).toBe(false);
  });

  it("disputes are reachable from every post-payment working state", () => {
    for (const from of [
      "BOOKED",
      "PRE_PRODUCTION",
      "APPROVAL_PENDING",
      "IN_PROGRESS",
      "PROOF_SUBMITTED",
      "BUYER_REVIEW",
      "REVISION_REQUESTED",
    ] as const) {
      expect(canTransitionCampaign(from, "DISPUTED", "BUYER"), `${from} → DISPUTED`).toBe(true);
    }
  });

  it("terminal states have no exits", () => {
    for (const to of CAMPAIGN_STATES) {
      for (const role of ["BUYER", "SELLER", "ADMIN"] as const) {
        expect(canTransitionCampaign("COMPLETED", to, role)).toBe(false);
        expect(canTransitionCampaign("REFUNDED", to, role)).toBe(false);
      }
    }
  });

  it("cannot skip payment", () => {
    expect(canTransitionCampaign("OFFER_PENDING", "BOOKED", "BUYER")).toBe(false);
    expect(canTransitionCampaign("OFFER_PENDING", "IN_PROGRESS", "ADMIN")).toBe(false);
    expect(() => assertCampaignTransition("OFFER_PENDING", "BOOKED", "ADMIN")).toThrow(
      TransitionError,
    );
  });

  it("transition helper only lists legal moves for the role", () => {
    expect(campaignTransitionsFrom("BUYER_REVIEW", "BUYER")).toEqual(
      expect.arrayContaining(["REVISION_REQUESTED", "ACCEPTED", "DISPUTED"]),
    );
    expect(campaignTransitionsFrom("BUYER_REVIEW", "SELLER")).not.toContain("ACCEPTED");
  });
});
