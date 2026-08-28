import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";
import { Stamp } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const listings = await prisma.listing.findMany({
    where: { state: "LIVE" },
    include: { category: true, seller: { include: { user: true } }, media: true },
    orderBy: { createdAt: "asc" },
    take: 6,
  });

  return (
    <div>
      {/* Hero */}
      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-signal">
            Denver first · U.S. marketplace
          </p>
          <h1 className="headline mt-4 max-w-4xl text-5xl sm:text-7xl">
            Sponsor anything. Show up anywhere.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-soft">
            Book real people, real moments, and real-world activations — with clear
            deliverables and proof. The world is full of ad space nobody can buy. Until now.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/browse"
              className="rounded bg-signal px-6 py-3 text-lg font-bold text-white hover:bg-signal-dark"
            >
              Find something to sponsor
            </Link>
            <Link
              href="/sell"
              className="rounded border-2 border-ink px-6 py-3 text-lg font-bold hover:bg-ink hover:text-paper"
            >
              List something sponsorable
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Stamp tone="ok">Verified sellers</Stamp>
            <Stamp tone="signal">Timestamped proof</Stamp>
            <Stamp tone="ink">Payout after acceptance</Stamp>
          </div>
        </div>
      </section>

      {/* Live listings */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="headline text-3xl sm:text-4xl">Live in Denver</h2>
          <Link href="/browse" className="font-bold text-signal hover:underline">
            Browse all →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={{
                slug: l.slug,
                title: l.title,
                pitch: l.pitch,
                city: l.city,
                basePriceCents: l.basePriceCents,
                categoryName: l.category.name,
                sellerName: l.seller.displayName,
                sellerVerified: l.seller.user.identityStatus === "VERIFIED",
                venueApprovalRequired: l.venueApprovalRequired,
                imageUrl: l.media[0]?.url,
                imageAlt: l.media[0]?.alt,
              }}
            />
          ))}
        </div>
      </section>

      {/* How it works strip */}
      <section className="border-y-2 border-ink bg-ink text-paper">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          {[
            [
              "1 · Pick or post",
              "Book a packaged sponsorship straight from the marketplace, or post a campaign brief and get curated proposals within 48 hours.",
            ],
            [
              "2 · We produce",
              "Every campaign runs on a checklist: agreement, venue approvals, permits, disclosure, and a scheduled activation date.",
            ],
            [
              "3 · Proof, then payout",
              "Sellers submit timestamped proof. You review and accept. Only then is the seller payout released. No proof, no payout.",
            ],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="text-xl font-extrabold text-signal">{t}</h3>
              <p className="mt-3 text-sm opacity-90">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brief CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-lg border-2 border-ink bg-signal-soft p-8 sm:p-12">
          <h2 className="headline max-w-2xl text-3xl sm:text-4xl">
            Have a goal, not a listing in mind?
          </h2>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Tell us the objective, audience, city, and budget. Our team matches you with
            vetted real-world inventory and sends back concrete proposals — typically within
            two business days.
          </p>
          <Link
            href="/brief"
            className="mt-6 inline-block rounded bg-ink px-6 py-3 font-bold text-paper hover:bg-signal"
          >
            Post a campaign brief
          </Link>
        </div>
      </section>
    </div>
  );
}
