import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { StateBadge } from "@/components/badges";
import { formatCents } from "@/lib/fees";
import { formatDate, formatState } from "@/lib/format";
import {
  acceptProofAction,
  advanceCampaignAction,
  openDisputeAction,
  postMessageAction,
  requestRevisionAction,
  submitProofAction,
  submitReviewAction,
} from "./actions";
import { ActionForm, Field, TextArea } from "@/components/form";

export const metadata: Metadata = { title: "Campaign" };
export const dynamic = "force-dynamic";

const CAMPAIGN_STEPS = [
  "BOOKED",
  "PRE_PRODUCTION",
  "IN_PROGRESS",
  "PROOF_SUBMITTED",
  "BUYER_REVIEW",
  "ACCEPTED",
  "PAYOUT_RELEASED",
  "COMPLETED",
];

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booked?: string }>;
}) {
  const [{ id }, { booked }] = await Promise.all([params, searchParams]);
  const session = await getSession();
  if (!session) redirect("/login");

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      org: { include: { memberships: true } },
      listing: { include: { seller: true } },
      package: true,
      deliverables: { orderBy: { sortOrder: "asc" } },
      proofs: { orderBy: { submittedAt: "desc" }, include: { revisions: true } },
      payment: { include: { refunds: true } },
      payout: true,
      dispute: true,
      agreement: true,
      reviews: { include: { author: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: true } },
    },
  });
  if (!campaign) notFound();
  const isBuyer = campaign.org.memberships.some((m) => m.userId === session.id);
  const isSeller = campaign.listing.seller.userId === session.id;
  const isAdmin = session.role === "ADMIN";
  if (!isBuyer && !isSeller && !isAdmin) redirect("/dashboard");

  const stepIndex = CAMPAIGN_STEPS.indexOf(campaign.state);
  const alreadyReviewed = campaign.reviews.some((r) => r.author.id === session.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {booked && (
        <div className="mb-6 rounded-lg border-2 border-ok bg-ok-soft p-4 font-bold text-ok">
          Booked. Payment captured — the seller has been notified and pre-production begins.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="headline text-3xl sm:text-4xl">{campaign.title}</h1>
        <StateBadge state={campaign.state} />
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        <Link href={`/listings/${campaign.listing.slug}`} className="font-bold text-signal hover:underline">
          {campaign.listing.title}
        </Link>{" "}
        · seller {campaign.listing.seller.displayName} · scheduled {formatDate(campaign.scheduledFor)}
      </p>

      {/* Progress rail */}
      {stepIndex >= 0 && (
        <ol className="mt-6 flex flex-wrap gap-2" aria-label="Campaign progress">
          {CAMPAIGN_STEPS.map((s, i) => (
            <li
              key={s}
              className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wide ${
                i < stepIndex
                  ? "bg-ok-soft text-ok"
                  : i === stepIndex
                    ? "bg-signal text-white"
                    : "bg-line/50 text-ink-soft"
              }`}
            >
              {formatState(s)}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* Deliverables */}
          <section className="rounded-lg border-2 border-ink bg-white p-6">
            <h2 className="font-extrabold">Deliverables</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {campaign.deliverables.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <span>{d.title}</span>
                  <StateBadge state={d.status} />
                </li>
              ))}
            </ul>
          </section>

          {/* Proof */}
          <section className="rounded-lg border-2 border-ink bg-white p-6">
            <h2 className="font-extrabold">Proof of completion</h2>
            {campaign.proofs.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">No proof submitted yet.</p>
            ) : (
              <ul className="mt-3 space-y-4">
                {campaign.proofs.map((p) => (
                  <li key={p.id} className="rounded border-2 border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded bg-ink px-2 py-0.5 text-xs font-bold text-paper">
                        captured {new Date(p.capturedAt).toLocaleString("en-US")}
                      </span>
                      <StateBadge state={p.status} />
                    </div>
                    {p.url.endsWith(".svg") || p.url.match(/\.(png|jpe?g|webp)$/) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- demo proof media
                      <img src={p.url} alt={p.caption} className="mt-3 w-full rounded border border-line" />
                    ) : (
                      <a href={p.url} className="mt-3 block break-all text-sm font-bold text-signal hover:underline">
                        {p.url}
                      </a>
                    )}
                    <p className="mt-2 text-sm">{p.caption}</p>
                    {p.revisions.map((r) => (
                      <p key={r.id} className="mt-2 rounded bg-danger-soft p-2 text-xs text-danger">
                        Revision requested: {r.reason}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            )}

            {/* Seller: submit proof */}
            {(isSeller || isAdmin) &&
              (campaign.state === "IN_PROGRESS" || campaign.state === "REVISION_REQUESTED") && (
                <div className="mt-4 border-t-2 border-line pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide">Submit proof</h3>
                  <ActionForm action={submitProofAction} submitLabel="Submit proof" className="mt-3 space-y-3">
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <Field
                      label="Proof URL"
                      name="url"
                      placeholder="/demo/proof-bike.svg or https://…"
                      hint="Demo build: paste a URL (production uses direct uploads with signed URLs)."
                    />
                    <Field label="Caption" name="caption" placeholder="Placement at start line, 9:02 AM" />
                    <Field label="Captured at" name="capturedAt" type="datetime-local" />
                  </ActionForm>
                </div>
              )}

            {/* Buyer: start review / accept / revise */}
            {(isBuyer || isAdmin) && campaign.state === "PROOF_SUBMITTED" && (
              <form action={advanceCampaignAction} className="mt-4 border-t-2 border-line pt-4">
                <input type="hidden" name="campaignId" value={campaign.id} />
                <input type="hidden" name="to" value="BUYER_REVIEW" />
                <button type="submit" className="rounded bg-ink px-4 py-2 font-bold text-paper hover:bg-signal">
                  Start reviewing proof
                </button>
              </form>
            )}
            {(isBuyer || isAdmin) && campaign.state === "BUYER_REVIEW" && (
              <div className="mt-4 space-y-4 border-t-2 border-line pt-4">
                <form action={acceptProofAction}>
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <button type="submit" className="w-full rounded bg-ok px-4 py-2.5 font-bold text-white hover:opacity-90">
                    Accept proof — release path to payout
                  </button>
                </form>
                <details className="rounded border-2 border-line p-3">
                  <summary className="cursor-pointer text-sm font-bold">Request a revision instead</summary>
                  <ActionForm action={requestRevisionAction} submitLabel="Request revision" className="mt-3 space-y-3">
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <TextArea label="What needs to change?" name="reason" rows={3} />
                  </ActionForm>
                </details>
              </div>
            )}
          </section>

          {/* Messages */}
          <section className="rounded-lg border-2 border-ink bg-white p-6">
            <h2 className="font-extrabold">Messages</h2>
            <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto text-sm">
              {campaign.messages.length === 0 && (
                <li className="text-ink-soft">No messages yet. Keep all campaign scope in here.</li>
              )}
              {campaign.messages.map((m) => (
                <li key={m.id} className={m.sender.id === session.id ? "text-right" : ""}>
                  <span
                    className={`inline-block max-w-[85%] rounded px-3 py-2 ${
                      m.sender.id === session.id ? "bg-signal-soft" : "bg-line/40"
                    }`}
                  >
                    <span className="block text-xs font-bold text-ink-soft">{m.sender.name}</span>
                    {m.body}
                  </span>
                </li>
              ))}
            </ul>
            <form action={postMessageAction} className="mt-4 flex gap-2">
              <input type="hidden" name="campaignId" value={campaign.id} />
              <input
                name="body"
                required
                placeholder="Write a message…"
                aria-label="Message"
                className="flex-1 rounded border-2 border-ink/30 px-3 py-2 text-sm focus:border-signal focus:outline-none"
              />
              <button type="submit" className="rounded bg-ink px-4 py-2 font-bold text-paper hover:bg-signal">
                Send
              </button>
            </form>
          </section>

          {/* Reviews */}
          {(campaign.state === "COMPLETED" || campaign.state === "PAYOUT_RELEASED") && (
            <section className="rounded-lg border-2 border-ink bg-white p-6">
              <h2 className="font-extrabold">Reviews</h2>
              {campaign.reviews.map((r) => (
                <div key={r.id} className="mt-3 rounded border-2 border-line p-3 text-sm">
                  <p className="font-bold">
                    {"★".repeat(r.rating)}
                    <span className="text-line">{"★".repeat(5 - r.rating)}</span>{" "}
                    <span className="font-normal text-ink-soft">— {r.author.name}</span>
                  </p>
                  <p className="mt-1">{r.body}</p>
                </div>
              ))}
              {!alreadyReviewed && (
                <ActionForm action={submitReviewAction} submitLabel="Post review" className="mt-4 space-y-3">
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <Field label="Rating (1–5)" name="rating" type="number" defaultValue="5" />
                  <TextArea label="Review" name="body" rows={2} />
                </ActionForm>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className="rounded-lg border-2 border-ink bg-white p-6">
            <h2 className="font-extrabold">Money</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Package price</dt>
                <dd className="font-semibold">{formatCents(campaign.priceCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Service fee</dt>
                <dd className="font-semibold">{formatCents(campaign.buyerFeeCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Seller payout</dt>
                <dd className="font-semibold">{formatCents(campaign.sellerPayoutCents)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-2">
                <dt>Payment</dt>
                <dd>{campaign.payment ? <StateBadge state={campaign.payment.status} /> : "—"}</dd>
              </div>
              {campaign.payment?.refunds.map((r) => (
                <div key={r.id} className="flex justify-between text-danger">
                  <dt>Refund</dt>
                  <dd>-{formatCents(r.amountCents)}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <dt>Payout</dt>
                <dd>{campaign.payout ? <StateBadge state={campaign.payout.status} /> : "—"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-ink-soft">
              Payout is released by operations after proof acceptance.
            </p>
          </section>

          {/* Seller production controls */}
          {(isSeller || isAdmin) && ["BOOKED", "PRE_PRODUCTION", "APPROVAL_PENDING"].includes(campaign.state) && (
            <section className="rounded-lg border-2 border-ink bg-white p-6">
              <h2 className="font-extrabold">Production</h2>
              <p className="mt-2 text-xs text-ink-soft">
                Move the campaign forward as you complete pre-production. Venue approvals and
                permits are tracked by operations.
              </p>
              <div className="mt-3 space-y-2">
                {campaign.state === "BOOKED" && (
                  <form action={advanceCampaignAction}>
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <input type="hidden" name="to" value="PRE_PRODUCTION" />
                    <button type="submit" className="w-full rounded bg-ink px-4 py-2 font-bold text-paper hover:bg-signal">
                      Begin pre-production
                    </button>
                  </form>
                )}
                {campaign.state === "PRE_PRODUCTION" && (
                  <>
                    {campaign.listing.state !== "LIVE" && (
                      <form action={advanceCampaignAction}>
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <input type="hidden" name="to" value="APPROVAL_PENDING" />
                        <button type="submit" className="w-full rounded border-2 border-ink px-4 py-2 font-bold hover:bg-ink hover:text-paper">
                          Request venue/permit approval
                        </button>
                      </form>
                    )}
                    <form action={advanceCampaignAction}>
                      <input type="hidden" name="campaignId" value={campaign.id} />
                      <input type="hidden" name="to" value="IN_PROGRESS" />
                      <button type="submit" className="w-full rounded bg-ink px-4 py-2 font-bold text-paper hover:bg-signal">
                        Start execution
                      </button>
                    </form>
                  </>
                )}
                {campaign.state === "APPROVAL_PENDING" && (
                  <p className="rounded bg-warn-soft p-3 text-xs font-semibold text-warn">
                    Waiting on operations to confirm venue approval / permits.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Dispute */}
          {!campaign.dispute &&
            ["BOOKED", "PRE_PRODUCTION", "APPROVAL_PENDING", "IN_PROGRESS", "PROOF_SUBMITTED", "BUYER_REVIEW", "REVISION_REQUESTED"].includes(campaign.state) && (
              <details className="rounded-lg border-2 border-danger bg-white p-6">
                <summary className="cursor-pointer font-extrabold text-danger">Open a dispute</summary>
                <p className="mt-2 text-xs text-ink-soft">
                  Disputes pause the campaign and hold the payout while a human reviews the
                  agreement and proof. Try a revision request first.
                </p>
                <ActionForm action={openDisputeAction} submitLabel="Open dispute" className="mt-3 space-y-3">
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <TextArea label="What went wrong?" name="reason" rows={3} />
                </ActionForm>
              </details>
            )}
          {campaign.dispute && (
            <section className="rounded-lg border-2 border-danger bg-danger-soft p-6">
              <h2 className="font-extrabold text-danger">Dispute {campaign.dispute.status.toLowerCase()}</h2>
              <p className="mt-2 text-sm">{campaign.dispute.reason}</p>
              {campaign.dispute.resolution && (
                <p className="mt-2 text-sm font-semibold">Resolution: {campaign.dispute.resolution}</p>
              )}
            </section>
          )}

          {/* Agreement */}
          <details className="rounded-lg border-2 border-ink bg-white p-6">
            <summary className="cursor-pointer font-extrabold">Campaign agreement</summary>
            <p className="mt-3 whitespace-pre-line text-xs text-ink-soft">{campaign.agreement?.text}</p>
          </details>

          {/* Rebook */}
          {campaign.state === "COMPLETED" && isBuyer && (
            <Link
              href={`/listings/${campaign.listing.slug}`}
              className="block rounded-lg bg-signal px-4 py-3 text-center font-bold text-white hover:bg-signal-dark"
            >
              Rebook this seller
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
