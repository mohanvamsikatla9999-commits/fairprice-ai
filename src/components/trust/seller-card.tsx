import Link from "next/link";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { TrustBadge, type TrustLevel } from "@/components/trust/trust-badge";
import { cn } from "@/lib/utils";

export interface SellerCardProps {
  id: string;
  name: string;
  imageUrl?: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
  memberSince?: string;
  trustLevel?: TrustLevel;
  trustScore?: number;
  href?: string;
  className?: string;
}

export function SellerCard({
  id,
  name,
  imageUrl,
  location,
  rating = 0,
  reviewCount = 0,
  memberSince,
  trustLevel = "new",
  trustScore,
  href,
  className,
}: SellerCardProps) {
  const link = href ?? `/seller/${id}`;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-start gap-4 p-5">
        <Avatar className="h-14 w-14">
          <AvatarImage src={imageUrl} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={link}
              className="font-display text-lg font-semibold hover:text-primary"
            >
              {name}
            </Link>
            <TrustBadge level={trustLevel} score={trustScore} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted">
            {rating > 0 ? (
              <span className="inline-flex items-center gap-1 text-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {rating.toFixed(1)}
                <span className="text-foreground-muted">({reviewCount})</span>
              </span>
            ) : (
              <span>No ratings yet</span>
            )}
            {location ? <span>{location}</span> : null}
            {memberSince ? <span>Member since {memberSince}</span> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
