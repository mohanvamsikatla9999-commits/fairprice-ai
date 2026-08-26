import Link from "next/link";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";

export function Testimonials() {
  return (
    <section className="bg-background-muted py-20">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow="Community"
          title="Built for real trades."
          description="We don’t show fabricated reviews. As buyers and sellers use FairPrice, authentic stories belong here."
        />
        <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-dashed border-border bg-white px-6 py-12 text-center">
          <p className="text-foreground-muted">
            No mock testimonials. List an item or check a fair price to get started.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/sell">Sell something</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/value">Check FairPrice</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
