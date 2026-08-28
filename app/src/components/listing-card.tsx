import Link from "next/link";
import { formatCents } from "@/lib/fees";
import { Stamp } from "./badges";

export interface ListingCardData {
  slug: string;
  title: string;
  pitch: string;
  city: string;
  basePriceCents: number;
  categoryName: string;
  sellerName: string;
  sellerVerified: boolean;
  venueApprovalRequired: boolean;
  imageUrl?: string;
  imageAlt?: string;
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border-2 border-ink bg-white transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-signal"
    >
      <div className="relative aspect-[8/5] w-full overflow-hidden border-b-2 border-ink bg-line/40">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- demo SVG placeholders, no optimization needed
          <img
            src={listing.imageUrl}
            alt={listing.imageAlt ?? ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-soft">No image yet</div>
        )}
        <span className="absolute left-3 top-3 rounded bg-ink px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-paper">
          {listing.categoryName}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-extrabold leading-snug group-hover:text-signal">
          {listing.title}
        </h3>
        <p className="line-clamp-2 text-sm text-ink-soft">{listing.pitch}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-sm">
          <span className="font-extrabold">{formatCents(listing.basePriceCents)}+</span>
          <span className="text-ink-soft">· {listing.city}</span>
          <span className="text-ink-soft">· by {listing.sellerName}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {listing.sellerVerified && <Stamp tone="ok">Verified seller</Stamp>}
          {listing.venueApprovalRequired && <Stamp tone="ink">Venue approval req.</Stamp>}
        </div>
      </div>
    </Link>
  );
}
