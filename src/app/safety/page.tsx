import Link from "next/link";
import { ShieldCheck, MapPin, CreditCard, Phone, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIPS = [
  {
    icon: MapPin,
    color: "bg-blue-100 text-blue-700",
    title: "Meet in public",
    tips: [
      "Choose well-lit, busy locations: mall food courts, ATM lobbies, metro exits",
      "Meet during daytime hours, never at night in isolated areas",
      "Never go to a stranger's home for a first meetup",
      "Bring someone you trust for high-value transactions",
    ],
  },
  {
    icon: CreditCard,
    color: "bg-green-100 text-green-700",
    title: "Payment safety",
    tips: [
      "Pay only after physically inspecting the item",
      "Never pay a booking advance or holding fee before meetup",
      "Use UPI face-to-face (scan and pay after inspection)",
      "Never share your UPI PIN, CVV, or OTP with anyone",
      "Avoid bank transfer to strangers — no buyer protection",
    ],
  },
  {
    icon: Phone,
    color: "bg-purple-100 text-purple-700",
    title: "Communication red flags",
    tips: [
      "Insisting on WhatsApp only (bypasses platform safety tools)",
      "Asking for advance payment before meeting",
      "Pressure tactics: 'other buyer is coming', 'limited time offer'",
      "Sending payment links or QR codes before meetup",
      "Claiming to be abroad but shipping locally",
    ],
  },
  {
    icon: ShieldCheck,
    color: "bg-amber-100 text-amber-700",
    title: "Inspect before paying",
    tips: [
      "Phones: check IMEI matches box, test all hardware, check battery health",
      "Laptops: boot to OS, check battery cycles, test all ports",
      "Vehicles: verify RC, insurance, check RTO number on registry",
      "Electronics: plug in and test before payment",
      "Never take the item 'to test at home' before paying",
    ],
  },
];

const SCAM_TYPES = [
  { title: "Advance payment scam", desc: "Seller asks for advance to 'hold' the item. Legitimate sellers never require this." },
  { title: "OTP scam", desc: "Buyer asks you to read out an OTP 'to confirm payment'. This is always fraud — never share OTPs." },
  { title: "QR code scam", desc: "Buyer sends you a QR to 'receive payment'. Scanning it debits your account instead." },
  { title: "Item switch", desc: "Seller shows you a good item but hands over a damaged/different one. Always inspect what you receive." },
  { title: "Fake payment screenshot", desc: "Buyer shows a fake UPI success screenshot. Always verify in your UPI app before handing over the item." },
  { title: "Remote screen access", desc: "Someone calls asking to share your screen 'for support'. Hang up immediately." },
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white pb-16">
      <div className="hero-blue">
        <div className="container-page py-16 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Trust & Safety</p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Safety centre</h1>
          <p className="mt-4 max-w-xl text-white/80">
            Practical guidance for safer local deals across India. Read this before your first meetup.
          </p>
        </div>
      </div>

      <div className="container-page py-14">
        <div className="grid gap-6 sm:grid-cols-2">
          {TIPS.map((tip) => (
            <div key={tip.title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tip.color}`}>
                <tip.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-3">{tip.title}</h3>
              <ul className="space-y-2">
                {tip.tips.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-foreground-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Common scams */}
      <div className="border-y border-border bg-white">
        <div className="container-page py-14">
          <div className="flex items-center gap-3 mb-8">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="font-display text-2xl font-bold">Common scams to avoid</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SCAM_TYPES.map((s) => (
              <div key={s.title} className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="font-semibold text-red-800">{s.title}</p>
                <p className="mt-1 text-sm text-red-700">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reporting */}
      <div className="container-page py-14">
        <div className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h2 className="font-display text-2xl font-bold">See something suspicious?</h2>
          <p className="mt-2 text-foreground-muted">
            Report any listing using the Report button on the product page.
            Our trust team reviews reports within 24 hours. For urgent safety threats, contact us directly.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="lime"><Link href="/marketplace">Browse safely</Link></Button>
            <Button asChild variant="outline"><Link href="/contact">Contact trust team</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
