import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="headline text-4xl sm:text-6xl">Talk to a human</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-soft">
        Early SponsorThis is deliberately high-touch — every campaign has a real operator behind
        it. The fastest routes:
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border-2 border-ink bg-white p-6">
          <h2 className="font-extrabold">Brands &amp; agencies</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Post a campaign brief and our team responds with curated proposals — typically
            within two business days.
          </p>
          <Link href="/brief" className="mt-4 inline-block font-bold text-signal hover:underline">
            Post a brief →
          </Link>
        </div>
        <div className="rounded-lg border-2 border-ink bg-white p-6">
          <h2 className="font-extrabold">Sellers</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Have something sponsorable? Submit it and a moderator will review it — usually
            within two business days.
          </p>
          <Link href="/sell" className="mt-4 inline-block font-bold text-signal hover:underline">
            List something →
          </Link>
        </div>
      </div>
      <p className="mt-8 text-sm text-ink-soft">
        General inquiries: this demo build has no live inbox yet — a support email and response
        SLA ship with the production launch checklist in the launch runbook.
      </p>
    </div>
  );
}
