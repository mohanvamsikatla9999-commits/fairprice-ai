"use client";

import * as React from "react";
import { Send, Mail, ShieldCheck, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CONTACT_TYPES = [
  { value: "support", label: "Account / product support" },
  { value: "safety", label: "Safety or fraud report" },
  { value: "business", label: "Business / API enquiry" },
  { value: "legal", label: "Legal or privacy request" },
  { value: "other", label: "Other" },
];

export default function ContactPage() {
  const [type, setType] = React.useState("support");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name, email, message }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message ?? "Failed to send");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please email us directly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white pb-16">
      <div className="hero-blue">
        <div className="container-page py-16 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Support</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Contact us</h1>
          <p className="mt-3 text-white/80">We usually reply within one business day.</p>
        </div>
      </div>

      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          {/* Contact info */}
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold mb-4">Other ways to reach us</h2>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: "General support", val: "support@fairprice.ai", href: "mailto:support@fairprice.ai" },
                  { icon: ShieldCheck, label: "Trust & Safety", val: "safety@fairprice.ai", href: "mailto:safety@fairprice.ai" },
                  { icon: MessageSquare, label: "Business enquiries", val: "business@fairprice.ai", href: "mailto:business@fairprice.ai" },
                ].map((c) => (
                  <a key={c.label} href={c.href} className="flex items-center gap-4 rounded-xl border border-border bg-white p-4 hover:border-primary/30 transition">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <c.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="text-sm text-primary">{c.val}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-800">For urgent safety issues</p>
              <p className="mt-1 text-sm text-amber-700">
                If you&apos;ve been scammed or are in immediate danger, contact local police first.
                Then report the listing via the Report button on the product page for fastest action.
              </p>
            </div>
          </div>

          {/* Form */}
          {sent ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <h3 className="font-display text-xl font-semibold text-green-800">Message sent!</h3>
              <p className="text-sm text-green-700">We&apos;ll reply to {email} within one business day.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-display font-semibold">Send us a message</h2>

              <div>
                <Label>Topic *</Label>
                <select
                  className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {CONTACT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>

              <div>
                <Label htmlFor="msg">Message *</Label>
                <Textarea id="msg" className="mt-1.5 min-h-28" value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Describe your issue or question in detail…" />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" variant="lime" className="w-full" disabled={busy || !name || !email || !message}>
                {busy ? "Sending…" : <><Send className="h-4 w-4" /> Send message</>}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
