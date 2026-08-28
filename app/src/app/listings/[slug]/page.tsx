import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeFees, formatCents } from "@/lib/fees";
import { RiskBadge, Stamp } from "@/components/badges";
import { bookPackageAction } from "./actions";
import { getSession } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await prisma.listing.findUnique({ where: { slug }, include: { media: true } });
  if (!listing) return { title: "Listing not found" };
  return {
    title: listing.title,
    description: listing.pitch,
    openGraph: {
      title: `${listing.title} · ${formatCents(listing.basePriceCents)}+ · ${listing.city}`,
      description: `${listing.pitch} — Sponsor This.`,
      images: listing.media[0] ? [{ url: listing.media[0].url }] : undefined,
    },
  };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [listing, session] = await Promise.all([
    prisma.listing.findUnique({
      where: { slug },
      include: {
        category: true,
        media: true,
        packages: { orderBy: { sortOrder: "asc" } },
        venueApprovals: true,
        permits: true,
        seller: { include: { user: true, reviews: { take: 3, orderBy: { createdAt: "desc" } } } },
      },
    }),
    getSession(),
  ]);
  if (!listing || (listing.state !== "LIVE" && session?.role !== "ADMIN")) notFound();

  const canBook = !session || session.role === "BUYER";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <Link href="/browse" className="font-bold text-signal">
          Browse
        </Link>
        <span>/</span>
        <span>{listing.category.name}</span>
        <span>/</span>
        <span>{listing.city}</span>
      </div>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="headline text-4xl sm:text-5xl">{listing.title}</h1>
          <p className="mt-4 text-lg text-ink-soft">{listing.pitch}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {listing.seller.user.identityStatus === "VERIFIED" && (
              <Stamp tone="ok">Verified seller</Stamp>
            )}
            <Stamp tone="signal">Proof backed</Stamp>
            {listing.venueApprovalRequired && <Stamp tone="ink">Venue approval required</Stamp>}
            <RiskBadge level={listing.riskLevel} />
          </div>

          {listing.media[0] && (
            // eslint-disable-next-line @next/next/no-img-element -- demo SVG placeholder
            <img
              src={listing.media[0].url}
              alt={listing.media[0].alt}
              className="mt-6 w-full rounded-lg border-2 border-ink"
            />
          )}

          <div className="prose mt-8 max-w-none">
            {listing.description.split("\n\n").map((p, i) => (
              <p key={i} className="mt-4 leading-relaxed text-ink">
                {p}
              </p>
            ))}
          </div>

          <dl className="mt-8 grid gap-4 rounded-lg border-2 border-ink bg-white p-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Proof method</dt>
              <dd className="mt-1 text-sm">{listing.proofMethod}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                Audience estimate
              </dt>
              <dd className="mt-1 text-sm">
                {listing.audienceEstimate ?? "None offered."}{" "}
                <span className="text-ink-soft">{listing.audienceEvidence}</span>
              </dd>
            </div>
            {listing.sponsorRestrictions && (
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                  Sponsor restrictions
                </dt>
                <dd className="mt-1 text-sm">{listing.sponsorRestrictions}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                Cancellation
              </dt>
              <dd className="mt-1 text-sm capitalize">{listing.cancellationPolicy.toLowerCase()} policy</dd>
            </div>
            {listing.venueApprovals.length > 0 && (
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                  Venue approval
                </dt>
                <dd className="mt-1 text-sm">
                  {listing.venueApprovals.map((v) => (
                    <span key={v.id}>
                      {v.venueName}: <strong>{v.status.toLowerCase()}</strong>. {v.notes}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {listing.permits.length > 0 && (
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Permits</dt>
                <dd className="mt-1 text-sm">
                  {listing.permits.map((p) => (
                    <span key={p.id}>
                      {p.kind} ({p.authority}): <strong>{p.status.toLowerCase()}</strong>
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {listing.availabilityNote && (
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                  Availability
                </dt>
                <dd className="mt-1 text-sm">{listing.availabilityNote}</dd>
              </div>
            )}
          </dl>

          {/* Seller */}
          <div className="mt-8 rounded-lg border-2 border-ink bg-white p-6">
            <h2 className="text-lg font-extrabold">About the seller</h2>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Link
                href={`/sellers/${listing.seller.id}`}
                className="text-xl font-bold text-signal hover:underline"
              >
                {listing.seller.displayName}
              </Link>
              <span className="text-sm text-ink-soft">{listing.seller.city}</span>
              <span className="rounded bg-ok-soft px-2 py-0.5 text-sm font-bold text-ok">
                Reliability {Math.round(listing.seller.reliabilityScore)}/100
              </span>
              <span className="text-sm text-ink-soft">
                {listing.seller.completedCount} completed campaigns
              </span>
            </div>
            {listing.seller.bio && <p className="mt-3 text-sm text-ink-soft">{listing.seller.bio}</p>}
          </div>
        </div>

        {/* Packages */}
        <aside aria-label="Packages">
          <div className="lg:sticky lg:top-6">
            <h2 className="text-lg font-extrabold uppercase tracking-wide">Packages</h2>
            <div className="mt-4 space-y-4">
              {listing.packages.map((pkg) => {
                const fees = computeFees(pkg.priceCents);
                return (
                  <div key={pkg.id} className="rounded-lg border-2 border-ink bg-white p-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-extrabold">{pkg.name}</h3>
                      <p className="text-xl font-extrabold">{formatCents(pkg.priceCents)}</p>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {pkg.deliverables.split("\n").map((d, i) => (
                        <li key={i} className="flex gap-2">
                          <span aria-hidden className="font-bold text-ok">
                            ✓
                          </span>
                          {d}
                        </li>
                      ))}
                    </ul>
                    {pkg.exclusions && (
                      <p className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">
                        <strong>Not included:</strong> {pkg.exclusions}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-ink-soft">
                      {pkg.exclusivity !== "NONE" && (
                        <>
                          <strong>{pkg.exclusivity.toLowerCase()} exclusivity.</strong>{" "}
                        </>
                      )}
                      {pkg.usageRightsDays}-day organic content usage rights.
                    </p>
                    <p className="mt-2 text-xs text-ink-soft">
                      Total at checkout {formatCents(fees.buyerTotalCents)} (incl. 5% service fee)
                    </p>
                    {canBook ? (
                      <form action={bookPackageAction}>
                        <input type="hidden" name="packageId" value={pkg.id} />
                        <button
                          type="submit"
                          className="mt-3 w-full rounded bg-signal px-4 py-2.5 font-bold text-white hover:bg-signal-dark"
                        >
                          Sponsor this
                        </button>
                      </form>
                    ) : (
                      <p className="mt-3 rounded bg-line/40 px-3 py-2 text-center text-xs font-semibold text-ink-soft">
                        Sign in as a buyer to book
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-ink-soft">
              Payment is collected at booking and the seller is paid only after you accept
              timestamped proof of completion.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
