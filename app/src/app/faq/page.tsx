import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

const FAQS: [string, string][] = [
  [
    "What exactly am I buying?",
    "A defined package: placement, deliverables, dates, restrictions, content usage rights, and a proof method. Never a vague promise of exposure.",
  ],
  [
    "How do I know the campaign actually happened?",
    "Sellers submit timestamped proof — photos, short videos, tracked links, GPS logs where relevant — against each deliverable. You review and accept before their payout releases.",
  ],
  [
    "Do you guarantee impressions or ROI?",
    "No, and we won't. Where a listing offers an audience estimate, it must state its methodology. Anything without evidence says so plainly.",
  ],
  [
    "What does it cost?",
    "Buyers pay the package price plus a 5% service fee. Sellers keep 80% of the package price. Managed campaigns are quoted all-in with a $1,500 minimum.",
  ],
  [
    "What if the venue says no?",
    "Listings that need venue approval say so, and branding is only confirmed after written approval. If approval fails, you get the documented fallback or a refund.",
  ],
  [
    "Is the poker sponsorship a gambling stake?",
    "No. Sponsors pay a fixed fee for placement and content. No share of winnings, no financial interest in the result, no guaranteed outcome — and the structure is under attorney review before real transactions.",
  ],
  [
    "Is sponsored content disclosed?",
    "Always. Clear paid-partnership disclosure is a deliverable requirement on every campaign, not an option.",
  ],
  [
    "What cities do you cover?",
    "Denver first. We open new cities only when there's real curated supply and buyer demand there — an empty city helps nobody.",
  ],
  [
    "Can I cancel?",
    "Each listing carries a cancellation policy shown before booking. Cancellations and refunds run through the platform so both sides are protected.",
  ],
  [
    "How do sellers get paid?",
    "Through the platform after proof acceptance. During this demo build, payments and payouts are simulated end-to-end; real money movement ships with Stripe Connect.",
  ],
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="headline text-4xl sm:text-6xl">Questions, answered</h1>
      <dl className="mt-10 space-y-6">
        {FAQS.map(([q, a]) => (
          <div key={q} className="rounded-lg border-2 border-ink bg-white p-6">
            <dt className="font-extrabold">{q}</dt>
            <dd className="mt-2 text-sm text-ink-soft">{a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
