import { prisma } from "@/lib/db";
import { StateBadge } from "@/components/badges";
import { formatCents } from "@/lib/fees";
import { refundAction, releasePayoutAction } from "../actions";
import { ActionForm, Field } from "@/components/form";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const campaigns = await prisma.campaign.findMany({
    where: { payment: { isNot: null } },
    orderBy: { updatedAt: "desc" },
    include: {
      org: true,
      payment: { include: { refunds: true } },
      payout: { include: { payoutAccount: { include: { sellerProfile: true } } } },
    },
  });

  return (
    <div>
      <h2 className="headline text-3xl">Payments &amp; payouts</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Payouts release manually, and only from campaigns in ACCEPTED state — proof first,
        money second. Refunds require a reason and are audited.
      </p>
      <ul className="mt-6 space-y-4">
        {campaigns.map((c) => (
          <li key={c.id} className="rounded-lg border-2 border-ink bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-extrabold">{c.title}</p>
                <p className="text-sm text-ink-soft">
                  {c.org.name} · campaign <StateBadge state={c.state} />
                </p>
              </div>
              <div className="text-right text-sm">
                <p>
                  Charged <strong>{formatCents(c.payment!.amountCents)}</strong>{" "}
                  <StateBadge state={c.payment!.status} />
                </p>
                <p className="mt-1">
                  Payout{" "}
                  <strong>
                    {c.payout ? formatCents(c.payout.amountCents) : "—"}
                  </strong>{" "}
                  {c.payout && <StateBadge state={c.payout.status} />}
                </p>
              </div>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 rounded bg-line/30 p-3 text-xs sm:grid-cols-4">
              <div>
                <dt className="font-bold text-ink-soft">Platform fee</dt>
                <dd>{formatCents(c.payment!.platformFeeCents)}</dd>
              </div>
              <div>
                <dt className="font-bold text-ink-soft">Buyer fee</dt>
                <dd>{formatCents(c.payment!.buyerFeeCents)}</dd>
              </div>
              <div>
                <dt className="font-bold text-ink-soft">Est. processing</dt>
                <dd>{formatCents(c.payment!.processingFeeCents)}</dd>
              </div>
              <div>
                <dt className="font-bold text-ink-soft">Refunded</dt>
                <dd>{formatCents(c.payment!.refunds.reduce((s, r) => s + r.amountCents, 0))}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap items-start gap-4 border-t border-line pt-4">
              {c.payout?.status === "HELD" && c.state === "ACCEPTED" && (
                <form action={releasePayoutAction}>
                  <input type="hidden" name="campaignId" value={c.id} />
                  <button className="rounded bg-ok px-4 py-2 text-sm font-bold text-white hover:opacity-90">
                    Release payout to {c.payout.payoutAccount.sellerProfile.displayName}
                  </button>
                </form>
              )}
              {c.payout?.status === "HELD" && c.state !== "ACCEPTED" && (
                <p className="rounded bg-warn-soft px-3 py-2 text-xs font-semibold text-warn">
                  Payout held — releases after buyer acceptance.
                </p>
              )}
              {(c.payment!.status === "CAPTURED" || c.payment!.status === "PARTIALLY_REFUNDED") && (
                <details className="min-w-64">
                  <summary className="cursor-pointer text-sm font-bold text-danger">Refund…</summary>
                  <ActionForm action={refundAction} submitLabel="Process refund" className="mt-2 space-y-2">
                    <input type="hidden" name="campaignId" value={c.id} />
                    <Field label="Amount (USD)" name="amountUsd" type="number" />
                    <Field label="Reason" name="reason" placeholder="Why this refund is happening" />
                  </ActionForm>
                </details>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
