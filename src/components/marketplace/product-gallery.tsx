"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ProductGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ProductGallery({ images, alt, className }: ProductGalleryProps) {
  const [active, setActive] = React.useState(0);
  const safeImages = images.length > 0 ? images : ["/placeholder-product.png"];

  React.useEffect(() => {
    setActive(0);
  }, [images]);

  function prev() {
    setActive((i) => (i === 0 ? safeImages.length - 1 : i - 1));
  }

  function next() {
    setActive((i) => (i === safeImages.length - 1 ? 0 : i + 1));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-background-muted">
        <Image
          src={safeImages[active]}
          alt={`${alt} — image ${active + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {safeImages.length > 1 ? (
          <>
            <Button
              type="button"
              variant="soft"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90"
              onClick={prev}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="soft"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90"
              onClick={next}
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        ) : null}
      </div>

      {safeImages.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition",
                active === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`Show image ${index + 1}`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
