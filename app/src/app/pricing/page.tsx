import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="headline text-4xl sm:text-6xl">Simple, visible pricing</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">
        No hidden margins. Buyers see the all-in price before paying; sellers see exactly what
        they&apos;ll receive before accepting.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border-2 border-ink bg-white p-8">
          <h2 className="text-xl font-extrabold">Marketplace bookings</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><strong>Buyers</strong> pay the package price plus a <strong>5% service fee</strong>.</li>
            <li><strong>Sellers</strong> receive <strong>80%</strong> of the package price.</li>
            <li>Minimum package price: <strong>$250</strong>.</li>
            <li>Listing is <strong>free</strong> — we only earn when you do.</li>
            <li>Card processing costs are absorbed by the platform.</li>
          </ul>
          <p className="mt-4 rounded bg-signal-soft p-3 text-sm">
            <strong>Example:</strong> a $750 package → buyer pays $787.50, seller receives
            $600, SponsorThis keeps the difference and covers processing.
          </p>
        </div>
        <div className="rounded-lg border-2 border-ink bg-white p-8">
          <h2 className="text-xl font-extrabold">Managed campaigns</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>All-in campaign pricing designed around your goal and budget.</li>
            <li>Minimum campaign fee: <strong>$1,500</strong>.</li>
            <li>Production, permits, insurance, merch, staffing, and travel quoted as pass-through line items with a 15% coordination markup.</li>
            <li>Rush execution (under 10 business days): +20%.</li>
            <li>Payment: 50% to schedule, 50% at proof acceptance.</li>
          </ul>
          <p className="mt-4 rounded bg-signal-soft p-3 text-sm">
            Best for brands that want a concept, sourcing, permits, and production handled
            end-to-end.
          </p>
        </div>
      </div>

      <p className="mt-8 text-sm text-ink-soft">
        Brand and agency subscription plans (lower fees, saved templates, team accounts,
        consolidated billing) are planned but not yet available — pricing here is complete and
        current.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/browse" className="rounded bg-signal px-6 py-3 font-bold text-white hover:bg-signal-dark">
          Browse packages
        </Link>
        <Link href="/brief" className="rounded border-2 border-ink px-6 py-3 font-bold hover:bg-ink hover:text-paper">
          Post a brief
        </Link>
      </div>
    </div>
  );
}
