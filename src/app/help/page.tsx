import Link from "next/link";
import { Sparkles, Tag, ShieldCheck, MessageSquare, User, CreditCard, Search, ChevronRight } from "lucide-react";

const TOPICS = [
  {
    icon: Sparkles,
    title: "AI Valuations",
    color: "bg-primary/10 text-primary",
    articles: [
      { title: "How does FairPrice AI calculate a price?", href: "/blog/ai-valuation-explained" },
      { title: "What does 'confidence' mean?", href: "/how-it-works" },
      { title: "Why is my valuation showing INSUFFICIENT_DATA?", href: "/how-it-works" },
    ],
  },
  {
    icon: Tag,
    title: "Selling",
    color: "bg-accent/20 text-accent-foreground",
    articles: [
      { title: "How do I list an item?", href: "/sell" },
      { title: "How to take good photos for AI scan", href: "/sell" },
      { title: "How do I mark my item as sold?", href: "/my-listings" },
      { title: "Can I edit my listing after publishing?", href: "/my-listings" },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Trust & Safety",
    color: "bg-green-100 text-green-700",
    articles: [
      { title: "How to spot a scam", href: "/safety" },
      { title: "Safe meetup checklist", href: "/blog/safe-meetup-checklist" },
      { title: "How to report a listing", href: "/safety" },
      { title: "What is face verification?", href: "/verify" },
    ],
  },
  {
    icon: User,
    title: "Account & Profile",
    color: "bg-blue-100 text-blue-700",
    articles: [
      { title: "How do I verify my phone?", href: "/register" },
      { title: "How do I delete my account?", href: "/settings/privacy" },
      { title: "View verification history", href: "/verify/history" },
      { title: "Change display name or city", href: "/settings" },
    ],
  },
  {
    icon: MessageSquare,
    title: "Buying & Chat",
    color: "bg-purple-100 text-purple-700",
    articles: [
      { title: "How do I contact a seller?", href: "/marketplace" },
      { title: "How do I make an offer?", href: "/marketplace" },
      { title: "What is FairPrice Assist?", href: "/how-it-works" },
    ],
  },
  {
    icon: CreditCard,
    title: "Payments & Pricing",
    color: "bg-amber-100 text-amber-700",
    articles: [
      { title: "Is FairPrice AI free?", href: "/pricing" },
      { title: "How does listing boost work?", href: "/pricing" },
      { title: "For business / API plans", href: "/for-business" },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white pb-16">
      <div className="hero-blue">
        <div className="container-page py-16 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Support</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Help centre</h1>
          <p className="mt-3 text-white/80 max-w-md">Answers for buyers, sellers, and businesses using FairPrice AI.</p>
          <div className="mt-6 flex max-w-md items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-3">
            <Search className="h-4 w-4 text-white/60 shrink-0" />
            <span className="text-white/60 text-sm">Search help articles… (browse topics below)</span>
          </div>
        </div>
      </div>

      <div className="container-page py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((topic) => (
            <div key={topic.title} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${topic.color}`}>
                <topic.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold mb-3">{topic.title}</h3>
              <ul className="space-y-2">
                {topic.articles.map((a) => (
                  <li key={a.title}>
                    <Link href={a.href} className="flex items-center gap-2 text-sm text-foreground-muted hover:text-primary">
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <h2 className="font-display text-xl font-semibold">Still need help?</h2>
          <p className="mt-2 text-foreground-muted">Our support team usually replies within one business day.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-bright transition">
              Contact support
            </Link>
            <Link href="/safety" className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary transition">
              Safety centre
            </Link>
          </div>
          <p className="mt-4 text-xs text-foreground-muted">For urgent safety issues, email <a href="mailto:safety@fairprice.ai" className="text-primary hover:underline">safety@fairprice.ai</a></p>
        </div>
      </div>
    </div>
  );
}
