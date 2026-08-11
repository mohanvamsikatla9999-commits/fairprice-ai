import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border/70 bg-gradient-to-br from-[#eef3ff] via-white to-[#f4ffe8]",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
      <div className="container-page relative py-12 md:py-16">
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base text-foreground-muted md:text-lg">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
