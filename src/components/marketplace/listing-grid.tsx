import { ListingCard, type ListingCardProps } from "@/components/marketplace/listing-card";
import { cn } from "@/lib/utils";

export interface ListingGridProps {
  listings: ListingCardProps[];
  className?: string;
  emptyMessage?: string;
}

export function ListingGrid({
  listings,
  className,
  emptyMessage = "No listings found.",
}: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background-muted px-6 py-16 text-center text-sm text-foreground-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {listings.map((listing) => (
        <ListingCard key={listing.id} {...listing} />
      ))}
    </div>
  );
}
