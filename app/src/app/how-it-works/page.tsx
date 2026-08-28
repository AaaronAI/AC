import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="headline text-4xl sm:text-6xl">How SponsorThis works</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">
        A sponsorship here is never a vague promise of exposure. It is a package: defined
        placement, dated deliverables, documented restrictions, timestamped proof, and payment
        that only reaches the seller after you accept the proof.
      </p>

      <h2 className="headline mt-12 text-3xl">For buyers</h2>
      <ol className="mt-6 space-y-6">
        {[
          ["Browse or brief", "Book a packaged sponsorship straight from the marketplace, or post a campaign brief with your objective, audience, city, dates, and budget. Our team curates proposals — typically within two business days."],
          ["Book and pay", "Checkout shows the all-in price: package price plus a 5% service fee. Funds are collected at booking and held by the platform while the campaign runs."],
          ["Approvals happen first", "If a listing needs venue approval or permits, branding is only confirmed once they're granted. You can see approval status on every campaign."],
          ["Review proof", "Sellers submit timestamped photos, clips, links, and logs against each deliverable. Accept it, or request a revision with specific notes."],
          ["Payout releases after acceptance", "Only when you accept the proof does the seller payout release. Disputes pause everything and route to a human."],
        ].map(([t, d], i) => (
          <li key={t} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal font-extrabold text-white">
              {i + 1}
            </span>
            <div>
              <h3 className="font-extrabold">{t}</h3>
              <p className="mt-1 text-sm text-ink-soft">{d}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="headline mt-12 text-3xl">For sellers</h2>
      <ol className="mt-6 space-y-6">
        {[
          ["List a package, not a promise", "Define the placement, deliverables, dates, restrictions, and proof method. No invented audience numbers — estimates must carry their methodology."],
          ["Pass moderation", "Every listing is human-reviewed for safety, legality, venue requirements, and our prohibited-categories policy before going live."],
          ["Deliver with a checklist", "Booked campaigns come with a deliverable checklist, an agreement, and disclosure requirements. Upload timestamped proof as you go."],
          ["Get paid on acceptance", "You keep 80% of the package price. Payout releases when the buyer accepts your proof — on-time, complete proof is what builds your reliability score."],
        ].map(([t, d], i) => (
          <li key={t} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink font-extrabold text-paper">
              {i + 1}
            </span>
            <div>
              <h3 className="font-extrabold">{t}</h3>
              <p className="mt-1 text-sm text-ink-soft">{d}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/browse" className="rounded bg-signal px-6 py-3 font-bold text-white hover:bg-signal-dark">
          Find something to sponsor
        </Link>
        <Link href="/sell" className="rounded border-2 border-ink px-6 py-3 font-bold hover:bg-ink hover:text-paper">
          List something sponsorable
        </Link>
      </div>
    </div>
  );
}
