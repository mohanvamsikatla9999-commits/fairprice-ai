import Link from "next/link";
import { INDIA_CITIES } from "@/config/india-cities";

export default function CitiesIndexPage() {
  return (
    <div className="container-page py-12">
      <h1 className="font-display text-3xl font-bold">Cities on FairPrice AI</h1>
      <p className="mt-2 text-foreground-muted">
        Start local. Grow India-wide.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {INDIA_CITIES.map((c) => (
          <Link
            key={c.slug}
            href={`/in/${c.slug}`}
            className="rounded-2xl border border-border bg-white px-4 py-4 hover:border-primary/40"
          >
            <p className="font-medium">{c.name}</p>
            <p className="text-sm text-foreground-muted">{c.state}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
