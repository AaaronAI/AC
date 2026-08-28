import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="headline text-4xl sm:text-6xl">
        The world is full of ad space nobody can buy. Until now.
      </h1>
      <div className="mt-8 space-y-4 text-lg leading-relaxed">
        <p>
          A cyclist&apos;s race kit. A dog&apos;s bandana in the park. A poker player&apos;s hat at a $200
          tournament. A month of bike commutes through downtown. Real people doing real things,
          watched by real humans — and until now there was no honest way for a brand to show up
          there.
        </p>
        <p>
          SponsorThis is a marketplace for exactly that: lawful, consensual, venue-approved
          real-world sponsorships, sold as packages with defined deliverables and timestamped
          proof. We started in Denver, operating every early campaign ourselves, because trust
          in a new category is earned one completed campaign at a time.
        </p>
        <p>
          Two things we refuse to do: invent audience numbers, and hide that something is
          sponsored. Every estimate carries its methodology. Every campaign is clearly
          disclosed. Sponsorship in the open is more interesting anyway.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/browse" className="rounded bg-signal px-6 py-3 font-bold text-white hover:bg-signal-dark">
          Browse the marketplace
        </Link>
        <Link href="/contact" className="rounded border-2 border-ink px-6 py-3 font-bold hover:bg-ink hover:text-paper">
          Talk to us
        </Link>
      </div>
    </div>
  );
}
