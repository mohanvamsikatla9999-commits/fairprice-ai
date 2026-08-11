import Link from "next/link";
import { INDIA_CITIES } from "@/config/india-cities";

export function CityDeals() {
  return (
    <section className="container-page py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Local deals
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold">Shop by city</h2>
          <p className="mt-2 max-w-xl text-foreground-muted">
            FairPrice starts local — find mobiles, bikes, and more near you with AI
            fair-value bands.
          </p>
        </div>
        <Link href="/in" className="text-sm font-medium text-primary hover:underline">
          All cities
        </Link>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {INDIA_CITIES.slice(0, 8).map((c) => (
          <Link
            key={c.slug}
            href={`/in/${c.slug}/mobiles`}
            className="rounded-2xl border border-border bg-white px-4 py-5 transition hover:border-primary/40 hover:shadow-sm"
          >
            <p className="font-display text-lg font-semibold">{c.name}</p>
            <p className="text-sm text-foreground-muted">Mobiles near you →</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/value"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Price anything
        </Link>
        <Link
          href="/alerts"
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium"
        >
          Set a deal alert
        </Link>
      </div>
    </section>
  );
}
