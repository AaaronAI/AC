import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";

export const metadata: Metadata = { title: "Browse sponsorships" };
export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; max?: string }>;
}) {
  const { q, category, max } = await searchParams;
  const maxCents = max ? Number.parseInt(max, 10) * 100 : undefined;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const listings = await prisma.listing.findMany({
    where: {
      state: "LIVE",
      ...(category ? { category: { slug: category } } : {}),
      ...(maxCents && Number.isFinite(maxCents) ? { basePriceCents: { lte: maxCents } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { pitch: { contains: q } },
              { description: { contains: q } },
              { city: { contains: q } },
            ],
          }
        : {}),
    },
    include: { category: true, seller: { include: { user: true } }, media: true },
    orderBy: { basePriceCents: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="headline text-4xl sm:text-5xl">Browse sponsorships</h1>
      <p className="mt-2 text-ink-soft">
        Every listing is a defined package: placement, deliverables, restrictions, and proof.
      </p>

      <form className="mt-8 grid gap-3 rounded-lg border-2 border-ink bg-white p-4 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search poker, bikes, dogs, coffee…"
          aria-label="Search listings"
          className="rounded border-2 border-ink/30 px-3 py-2 focus:border-signal focus:outline-none"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          aria-label="Category"
          className="rounded border-2 border-ink/30 px-3 py-2"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="max" defaultValue={max ?? ""} aria-label="Max price" className="rounded border-2 border-ink/30 px-3 py-2">
          <option value="">Any price</option>
          <option value="500">Up to $500</option>
          <option value="1000">Up to $1,000</option>
          <option value="2500">Up to $2,500</option>
        </select>
        <button type="submit" className="rounded bg-ink px-5 py-2 font-bold text-paper hover:bg-signal">
          Filter
        </button>
      </form>

      {listings.length === 0 ? (
        <div className="mt-12 rounded-lg border-2 border-dashed border-ink/30 p-12 text-center">
          <p className="text-xl font-bold">Nothing matches those filters yet.</p>
          <p className="mt-2 text-ink-soft">
            Supply is curated city-by-city. Post a brief and we&apos;ll source options for you.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
