// Canonical state machines for listings and campaigns (DECISIONS.md D-015).
// Every transition anywhere in the app must go through `canTransition` /
// `assertTransition` — route handlers never mutate `state` fields directly.

export const LISTING_STATES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "LIVE",
  "PAUSED",
  "BOOKED",
  "COMPLETED",
  "ARCHIVED",
  "REJECTED",
] as const;
export type ListingState = (typeof LISTING_STATES)[number];

export const CAMPAIGN_STATES = [
  "BRIEF_SUBMITTED",
  "MATCHING",
  "PROPOSALS_AVAILABLE",
  "OFFER_PENDING",
  "PAYMENT_AUTHORIZED",
  "BOOKED",
  "PRE_PRODUCTION",
  "APPROVAL_PENDING",
  "IN_PROGRESS",
  "PROOF_SUBMITTED",
  "BUYER_REVIEW",
  "REVISION_REQUESTED",
  "ACCEPTED",
  "DISPUTED",
  "REFUNDED",
  "PAYOUT_RELEASED",
  "COMPLETED",
] as const;
export type CampaignState = (typeof CAMPAIGN_STATES)[number];

export type Role = "BUYER" | "SELLER" | "ADMIN";

interface Transition<S extends string> {
  from: S;
  to: S;
  roles: Role[];
}

const LISTING_TRANSITIONS: Transition<ListingState>[] = [
  { from: "DRAFT", to: "SUBMITTED", roles: ["SELLER", "ADMIN"] },
  { from: "SUBMITTED", to: "UNDER_REVIEW", roles: ["ADMIN"] },
  { from: "UNDER_REVIEW", to: "CHANGES_REQUESTED", roles: ["ADMIN"] },
  { from: "UNDER_REVIEW", to: "APPROVED", roles: ["ADMIN"] },
  { from: "UNDER_REVIEW", to: "REJECTED", roles: ["ADMIN"] },
  { from: "CHANGES_REQUESTED", to: "SUBMITTED", roles: ["SELLER", "ADMIN"] },
  { from: "APPROVED", to: "LIVE", roles: ["ADMIN", "SELLER"] },
  { from: "LIVE", to: "PAUSED", roles: ["SELLER", "ADMIN"] },
  { from: "PAUSED", to: "LIVE", roles: ["SELLER", "ADMIN"] },
  { from: "LIVE", to: "BOOKED", roles: ["ADMIN", "BUYER"] },
  { from: "BOOKED", to: "COMPLETED", roles: ["ADMIN"] },
  { from: "BOOKED", to: "LIVE", roles: ["ADMIN"] }, // booking canceled/refunded
  { from: "COMPLETED", to: "ARCHIVED", roles: ["SELLER", "ADMIN"] },
  { from: "COMPLETED", to: "LIVE", roles: ["SELLER", "ADMIN"] }, // rebookable
  { from: "LIVE", to: "ARCHIVED", roles: ["SELLER", "ADMIN"] },
];

const CAMPAIGN_TRANSITIONS: Transition<CampaignState>[] = [
  { from: "BRIEF_SUBMITTED", to: "MATCHING", roles: ["ADMIN"] },
  { from: "MATCHING", to: "PROPOSALS_AVAILABLE", roles: ["ADMIN"] },
  { from: "PROPOSALS_AVAILABLE", to: "OFFER_PENDING", roles: ["BUYER", "ADMIN"] },
  // Direct package booking enters at OFFER_PENDING via checkout.
  { from: "OFFER_PENDING", to: "PAYMENT_AUTHORIZED", roles: ["BUYER", "ADMIN"] },
  { from: "PAYMENT_AUTHORIZED", to: "BOOKED", roles: ["ADMIN", "BUYER"] },
  { from: "BOOKED", to: "PRE_PRODUCTION", roles: ["ADMIN", "SELLER"] },
  { from: "PRE_PRODUCTION", to: "APPROVAL_PENDING", roles: ["ADMIN", "SELLER"] },
  { from: "APPROVAL_PENDING", to: "PRE_PRODUCTION", roles: ["ADMIN"] }, // approval denied, re-plan
  { from: "APPROVAL_PENDING", to: "IN_PROGRESS", roles: ["ADMIN"] },
  { from: "PRE_PRODUCTION", to: "IN_PROGRESS", roles: ["ADMIN", "SELLER"] }, // no approvals needed
  { from: "IN_PROGRESS", to: "PROOF_SUBMITTED", roles: ["SELLER", "ADMIN"] },
  { from: "PROOF_SUBMITTED", to: "BUYER_REVIEW", roles: ["ADMIN", "BUYER"] },
  { from: "BUYER_REVIEW", to: "REVISION_REQUESTED", roles: ["BUYER", "ADMIN"] },
  { from: "REVISION_REQUESTED", to: "PROOF_SUBMITTED", roles: ["SELLER", "ADMIN"] },
  { from: "BUYER_REVIEW", to: "ACCEPTED", roles: ["BUYER", "ADMIN"] },
  { from: "ACCEPTED", to: "PAYOUT_RELEASED", roles: ["ADMIN"] },
  { from: "PAYOUT_RELEASED", to: "COMPLETED", roles: ["ADMIN"] },
  // Disputes are reachable from any post-payment, pre-completion state.
  { from: "BOOKED", to: "DISPUTED", roles: ["BUYER", "ADMIN"] },
  { from: "PRE_PRODUCTION", to: "DISPUTED", roles: ["BUYER", "ADMIN"] },
  { from: "APPROVAL_PENDING", to: "DISPUTED", roles: ["BUYER", "ADMIN"] },
  { from: "IN_PROGRESS", to: "DISPUTED", roles: ["BUYER", "ADMIN"] },
  { from: "PROOF_SUBMITTED", to: "DISPUTED", roles: ["BUYER", "ADMIN"] },
  { from: "BUYER_REVIEW", to: "DISPUTED", roles: ["BUYER", "ADMIN"] },
  { from: "REVISION_REQUESTED", to: "DISPUTED", roles: ["BUYER", "SELLER", "ADMIN"] },
  { from: "DISPUTED", to: "REFUNDED", roles: ["ADMIN"] },
  { from: "DISPUTED", to: "ACCEPTED", roles: ["ADMIN"] }, // resolved in seller's favor
  // Admin cancellation/refund before execution.
  { from: "PAYMENT_AUTHORIZED", to: "REFUNDED", roles: ["ADMIN"] },
  { from: "BOOKED", to: "REFUNDED", roles: ["ADMIN"] },
  { from: "PRE_PRODUCTION", to: "REFUNDED", roles: ["ADMIN"] },
];

function findTransition<S extends string>(
  table: Transition<S>[],
  from: S,
  to: S,
): Transition<S> | undefined {
  return table.find((t) => t.from === from && t.to === to);
}

export function canTransitionListing(from: ListingState, to: ListingState, role: Role): boolean {
  const t = findTransition(LISTING_TRANSITIONS, from, to);
  return !!t && t.roles.includes(role);
}

export function canTransitionCampaign(from: CampaignState, to: CampaignState, role: Role): boolean {
  const t = findTransition(CAMPAIGN_TRANSITIONS, from, to);
  return !!t && t.roles.includes(role);
}

export class TransitionError extends Error {
  status = 409;
}

export function assertListingTransition(from: string, to: string, role: Role): void {
  if (!canTransitionListing(from as ListingState, to as ListingState, role)) {
    throw new TransitionError(`Listing transition ${from} → ${to} not allowed for ${role}`);
  }
}

export function assertCampaignTransition(from: string, to: string, role: Role): void {
  if (!canTransitionCampaign(from as CampaignState, to as CampaignState, role)) {
    throw new TransitionError(`Campaign transition ${from} → ${to} not allowed for ${role}`);
  }
}

export function listingTransitionsFrom(from: ListingState, role: Role): ListingState[] {
  return LISTING_TRANSITIONS.filter((t) => t.from === from && t.roles.includes(role)).map((t) => t.to);
}

export function campaignTransitionsFrom(from: CampaignState, role: Role): CampaignState[] {
  return CAMPAIGN_TRANSITIONS.filter((t) => t.from === from && t.roles.includes(role)).map((t) => t.to);
}

export const TERMINAL_CAMPAIGN_STATES: CampaignState[] = ["COMPLETED", "REFUNDED"];
