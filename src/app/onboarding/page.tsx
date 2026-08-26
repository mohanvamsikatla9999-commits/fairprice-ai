"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Tag, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  {
    value: "BUYER",
    label: "I want to buy",
    desc: "Find fair-priced used goods near me",
    icon: ShoppingBag,
    color: "border-blue-200 bg-blue-50 text-blue-700",
    active: "border-primary bg-primary/5",
  },
  {
    value: "SELLER",
    label: "I want to sell",
    desc: "List items with AI pricing",
    icon: Tag,
    color: "border-green-200 bg-green-50 text-green-700",
    active: "border-primary bg-primary/5",
  },
  {
    value: "BOTH",
    label: "Both",
    desc: "Buy and sell on FairPrice AI",
    icon: Repeat,
    color: "border-accent/40 bg-accent/10 text-accent-foreground",
    active: "border-primary bg-primary/5",
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [roleIntent, setRoleIntent] = React.useState<"BUYER" | "SELLER" | "BOTH">("BOTH");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Pre-fill name from auth session
  React.useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      const j = await r.json();
      if (j.ok) {
        setName(j.data.user.displayName || j.data.user.name || "");
        setCity(j.data.user.profile?.city || "");
      }
    }).catch(() => null);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, city, roleIntent }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Request failed");
      return;
    }
    // Redirect based on intent
    if (roleIntent === "SELLER") {
      router.push("/sell");
    } else if (roleIntent === "BUYER") {
      router.push("/marketplace");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white">
      <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            FairPrice AI
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">Welcome! Let&apos;s set up your account</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Takes 30 seconds. You can change everything later in Settings.
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-5">
            {/* Name */}
            <div>
              <Label htmlFor="name">Your name *</Label>
              <Input
                id="name"
                className="mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                required
              />
            </div>

            {/* City */}
            <div>
              <Label htmlFor="city">Your city</Label>
              <Input
                id="city"
                className="mt-1.5"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Hyderabad"
              />
              <p className="mt-1 text-xs text-foreground-muted">
                Helps us show relevant listings near you
              </p>
            </div>

            {/* Role intent */}
            <div>
              <Label>How will you use FairPrice AI? *</Label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {ROLE_OPTIONS.map((opt) => {
                  const selected = roleIntent === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRoleIntent(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition",
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-white hover:border-primary/30",
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        selected ? "bg-primary/10" : opt.color,
                      )}>
                        <opt.icon className={cn("h-5 w-5", selected ? "text-primary" : "")} />
                      </div>
                      <div>
                        <p className={cn("text-sm font-semibold", selected ? "text-primary" : "text-foreground")}>
                          {opt.label}
                        </p>
                        <p className="mt-0.5 text-xs text-foreground-muted">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="lime"
              size="lg"
              className="w-full"
              disabled={busy || !name.trim()}
            >
              {busy ? "Setting up…" : "Continue →"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-foreground-muted">
            <Link className="text-primary hover:underline" href="/dashboard">
              Skip for now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
