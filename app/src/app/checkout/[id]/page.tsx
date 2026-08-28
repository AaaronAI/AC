import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatCents } from "@/lib/fees";
import { payAction } from "./actions";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      org: { include: { memberships: true } },
      listing: { include: { seller: true } },
      package: true,
      agreement: true,
      deliverables: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!campaign) notFound();
  const isMember = campaign.org.memberships.some((m) => m.userId === session.id);
  if (!isMember) redirect("/dashboard");
  if (campaign.state !== "OFFER_PENDING") redirect(`/campaigns/${id}`);

  const total = campaign.priceCents + campaign.buyerFeeCents;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="headline text-4xl">Checkout</h1>
      <p className="mt-2 text-ink-soft">{campaign.title}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-lg border-2 border-ink bg-white p-6">
            <h2 className="font-extrabold">Deliverables</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {campaign.deliverables.map((d) => (
                <li key={d.id} className="flex gap-2">
                  <span aria-hidden className="font-bold text-ok">✓</span>
                  {d.title}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border-2 border-ink bg-white p-6">
            <h2 className="font-extrabold">Campaign agreement</h2>
            <p className="mt-3 whitespace-pre-line rounded bg-line/30 p-3 text-xs text-ink-soft">
              {campaign.agreement?.text}
            </p>
          </section>
        </div>

        <aside>
          <div className="rounded-lg border-2 border-ink bg-white p-6 md:sticky md:top-6">
            <h2 className="font-extrabold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Package price</dt>
                <dd className="font-semibold">{formatCents(campaign.priceCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Service fee (5%)</dt>
                <dd className="font-semibold">{formatCents(campaign.buyerFeeCents)}</dd>
              </div>
              <div className="flex justify-between border-t-2 border-ink pt-2 text-base">
                <dt className="font-extrabold">Total</dt>
                <dd className="font-extrabold">{formatCents(total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-ink-soft">
              Seller receives {formatCents(campaign.sellerPayoutCents)} after you accept proof of
              completion. Funds are held by the platform until then.
            </p>
            <form action={payAction} className="mt-4">
              <input type="hidden" name="campaignId" value={campaign.id} />
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" required className="mt-0.5" />
                <span>I accept the campaign agreement above.</span>
              </label>
              <button
                type="submit"
                className="mt-4 w-full rounded bg-signal px-4 py-3 font-bold text-white hover:bg-signal-dark"
              >
                Pay {formatCents(total)} (demo)
              </button>
            </form>
            <p className="mt-3 text-center text-xs text-ink-soft">
              Demo build: payment is simulated — no card is charged.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
