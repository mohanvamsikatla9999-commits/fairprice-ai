import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps {
  variant?: "listing-grid" | "detail" | "lines" | "cards";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  variant = "listing-grid",
  count = 8,
  className,
}: LoadingSkeletonProps) {
  if (variant === "lines") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" style={{ width: `${90 - i * 8}%` }} />
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className={cn("grid gap-6 lg:grid-cols-2", className)}>
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
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
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-border p-3">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
