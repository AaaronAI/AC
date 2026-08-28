import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "List something sponsorable" };

export default async function SellPage() {
  const session = await getSession();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="headline text-4xl sm:text-6xl">
        You&apos;re already doing something sponsorable.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">
        Racing. Walking the dog. Entering a tournament. Commuting past ten thousand people. If
        it&apos;s lawful, safe, consensual, and provable, a brand may pay to be part of it — and you
        keep 80% of every booking.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          ["Package it", "Define placement, deliverables, dates, restrictions, and how you'll prove completion. Our moderators help you get it right."],
          ["Free to list", "No listing fees, ever, during launch. We earn only when you get booked."],
          ["Paid on proof", "Payment is secured at booking and released to you when the buyer accepts your timestamped proof."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-lg border-2 border-ink bg-white p-6">
            <h2 className="font-extrabold">{t}</h2>
            <p className="mt-2 text-sm text-ink-soft">{d}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border-2 border-ink bg-signal-soft p-8">
        <h2 className="text-2xl font-extrabold">What makes a listing get approved?</h2>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {[
            "A specific moment, not vague 'exposure'",
            "Honest audience claims (or none at all)",
            "Venue approval flagged when needed",
            "A concrete proof method",
            "Clear sponsor restrictions",
            "Nothing on the prohibited list",
          ].map((i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="font-bold text-ok">✓</span>
              {i}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        {session?.role === "SELLER" ? (
          <Link
            href="/seller/listings/new"
            className="rounded bg-signal px-6 py-3 text-lg font-bold text-white hover:bg-signal-dark"
          >
            Create a listing
          </Link>
        ) : (
          <Link
            href="/signup?role=seller"
            className="rounded bg-signal px-6 py-3 text-lg font-bold text-white hover:bg-signal-dark"
          >
            Create a seller account
          </Link>
        )}
      </div>
    </div>
  );
}
