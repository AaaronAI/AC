import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";
import { Stamp } from "@/components/badges";

export const metadata: Metadata = { title: "Seller profile" };

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await prisma.sellerProfile.findUnique({
    where: { id },
    include: {
      user: true,
      listings: {
        where: { state: "LIVE" },
        include: { category: true, media: true, seller: { include: { user: true } } },
      },
      reviews: { orderBy: { createdAt: "desc" }, take: 10, include: { author: true } },
    },
  });
  if (!seller) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="headline text-4xl sm:text-5xl">{seller.displayName}</h1>
        {seller.user.identityStatus === "VERIFIED" && <Stamp tone="ok">Verified seller</Stamp>}
      </div>
      <p className="mt-2 text-ink-soft">{seller.city}</p>
      {seller.bio && <p className="mt-4 max-w-2xl">{seller.bio}</p>}

      <dl className="mt-8 grid max-w-2xl grid-cols-3 gap-4">
        {[
          ["Reliability", `${Math.round(seller.reliabilityScore)}/100`],
          ["Completed", String(seller.completedCount)],
          ["Avg. response", seller.responseHours ? `${seller.responseHours}h` : "—"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border-2 border-ink bg-white p-4 text-center">
            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{k}</dt>
            <dd className="mt-1 text-2xl font-extrabold">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="headline mt-12 text-3xl">Live listings</h2>
      {seller.listings.length === 0 ? (
        <p className="mt-4 text-ink-soft">No live listings right now.</p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {seller.listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={{
                slug: l.slug,
                title: l.title,
                pitch: l.pitch,
                city: l.city,
                basePriceCents: l.basePriceCents,
                categoryName: l.category.name,
                sellerName: seller.displayName,
                sellerVerified: seller.user.identityStatus === "VERIFIED",
                venueApprovalRequired: l.venueApprovalRequired,
                imageUrl: l.media[0]?.url,
                imageAlt: l.media[0]?.alt,
              }}
            />
          ))}
        </div>
      )}

      <h2 className="headline mt-12 text-3xl">Reviews</h2>
      {seller.reviews.length === 0 ? (
        <p className="mt-4 text-ink-soft">No reviews yet.</p>
      ) : (
        <ul className="mt-6 max-w-2xl space-y-4">
          {seller.reviews.map((r) => (
            <li key={r.id} className="rounded-lg border-2 border-ink bg-white p-5">
              <p className="font-bold" aria-label={`${r.rating} out of 5 stars`}>
                {"★".repeat(r.rating)}
                <span className="text-line">{"★".repeat(5 - r.rating)}</span>
              </p>
              <p className="mt-2 text-sm">{r.body}</p>
              <p className="mt-2 text-xs text-ink-soft">— {r.author.name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
