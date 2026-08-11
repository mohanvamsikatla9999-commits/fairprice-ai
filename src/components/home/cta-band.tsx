import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckFairPriceButton } from "@/components/valuation/check-fairprice-button";

export function CtaBand() {
  return (
    <section className="container-page pb-24">
      <div className="relative overflow-hidden rounded-[2rem] hero-blue px-6 py-14 text-center text-white sm:px-12">
        <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Ready when you are
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Price it fairly. Sell it faster.
          </h2>
          <p className="mt-4 text-base text-white/85 sm:text-lg">
            Run a FairPrice check in seconds — or list something today with valuation built in.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <CheckFairPriceButton label="Check FairPrice" />
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white hover:text-primary"
            >
              <Link href="/sell">Start selling</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
