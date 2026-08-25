import Link from "next/link";

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: `By accessing or using FairPrice AI ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Platform. These Terms apply to all users, including buyers, sellers, businesses, and visitors.

FairPrice AI is operated by FairPrice AI Technologies ("Company", "we", "us", "our"), incorporated in India. Use of the Platform constitutes acceptance of these Terms and our Privacy Policy.`,
  },
  {
    title: "2. Eligibility",
    body: `You must be at least 18 years of age to use the Platform. By using the Platform, you represent and warrant that you are 18 or older and have the legal capacity to enter into binding agreements under applicable Indian law.

Businesses using the API must be registered legal entities in India or another jurisdiction recognised by Indian law.`,
  },
  {
    title: "3. User accounts",
    body: `You may register using a verified Indian mobile number or email address. You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised access to your account.

FairPrice AI uses face verification powered by Gemini AI to reduce fraud. Face images are processed in memory and immediately discarded — we do not retain biometric data beyond the verification session.

You may not create multiple accounts to evade bans, manipulate listings, or circumvent safety measures. We reserve the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    title: "4. Listings and content",
    body: `Sellers are solely responsible for the accuracy of their listings. You agree not to list:
• Stolen, counterfeit, or prohibited goods under applicable Indian law
• Items that infringe third-party intellectual property rights
• Weapons, narcotics, or any item whose sale is restricted or prohibited
• Misleading descriptions, fabricated photos, or fraudulent pricing

We reserve the right to remove any listing that violates these Terms or applicable law, without notice.

AI valuations provided by FairPrice AI are estimates based on available market data and are not financial advice, certified appraisals, or guarantees of sale price.`,
  },
  {
    title: "5. Transactions",
    body: `FairPrice AI is a platform that facilitates connections between buyers and sellers. We are not a party to any transaction between users. All transactions are directly between the buyer and seller.

We do not guarantee the quality, safety, legality, or delivery of listed items. Buyers are responsible for inspecting items before payment. Sellers are responsible for accurate representation of items.

FairPrice Assist (where available) provides a structured transaction flow for high-value deals. It is not an escrow service regulated under Indian banking law and carries no deposit insurance.`,
  },
  {
    title: "6. Fees and payments",
    body: `Core Platform features — listing, browsing, messaging, and AI valuations — are provided free of charge to individual users. Optional paid features include listing boosts, featured placements, and business API plans.

All prices are in Indian Rupees (INR) inclusive of applicable taxes. Payments are processed through our payment providers. Fees paid for boosts and featured placements are non-refundable once the promotion period has begun.

We reserve the right to change our fee structure with 30 days' prior notice to registered users.`,
  },
  {
    title: "7. Prohibited conduct",
    body: `You agree not to:
• Engage in fraud, scams, or any activity intended to deceive other users
• Use automated tools, scrapers, or bots without prior written permission
• Attempt to reverse-engineer, decompile, or extract source code from the Platform
• Circumvent security features, rate limits, or access controls
• Harass, threaten, or abuse other users
• Use the Platform for spam, phishing, or unsolicited commercial messages
• Violate any applicable Indian or international law

Violation of these prohibitions may result in immediate account termination and referral to law enforcement.`,
  },
  {
    title: "8. Intellectual property",
    body: `All Platform content, including the FairPrice AI brand, logo, valuation algorithms, AI models, and software, are owned by FairPrice AI Technologies and protected under Indian copyright, trademark, and trade secret law.

User-generated content (listings, photos, descriptions) remains the property of the user. By posting content on the Platform, you grant FairPrice AI a non-exclusive, royalty-free, worldwide licence to display, reproduce, and distribute that content solely for operating and improving the Platform.`,
  },
  {
    title: "9. AI valuations disclaimer",
    body: `FairPrice AI provides automated price estimates using AI, market comparables, and publicly available pricing data. These valuations are:
• Estimates only — not certified appraisals
• Based on available data — accuracy depends on data quality and completeness
• Not financial or investment advice
• Not a guarantee of sale price or market value

We expressly disclaim any liability for decisions made based on AI valuations. Always conduct your own due diligence before buying or selling.`,
  },
  {
    title: "10. Limitation of liability",
    body: `To the maximum extent permitted under applicable Indian law, FairPrice AI Technologies shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to loss of data, loss of revenue, or damage to reputation.

Our total liability for any claim arising out of or relating to these Terms shall not exceed the amount you paid to us in the three months preceding the claim, or ₹1,000, whichever is greater.

Nothing in these Terms limits our liability for fraud, personal injury, or death caused by our negligence.`,
  },
  {
    title: "11. Indemnification",
    body: `You agree to indemnify and hold harmless FairPrice AI Technologies, its officers, employees, and partners from any claim, damages, losses, or expenses (including reasonable legal fees) arising from your use of the Platform, your listings, your transactions, or your violation of these Terms.`,
  },
  {
    title: "12. Governing law and disputes",
    body: `These Terms are governed by the laws of India. Any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana, India.

Before initiating legal proceedings, parties agree to attempt resolution through good-faith negotiation for 30 days. For disputes involving amounts under ₹10 lakh, parties agree to resolve through the Online Dispute Resolution mechanism of the relevant consumer forum.`,
  },
  {
    title: "13. Termination",
    body: `Either party may terminate these Terms at any time. You may close your account from Settings → Privacy → Account deletion. We may suspend or terminate your account immediately for violation of these Terms, with or without notice.

Upon termination, your right to use the Platform ceases immediately. Provisions that by their nature should survive termination (including intellectual property, limitation of liability, indemnification) shall survive.`,
  },
  {
    title: "14. Changes to terms",
    body: `We may update these Terms from time to time. Material changes will be communicated via in-app notification or email to registered users at least 14 days before they take effect. Continued use of the Platform after the effective date constitutes acceptance of the revised Terms.`,
  },
  {
    title: "15. Contact",
    body: `For questions about these Terms, contact us at legal@fairprice.ai or write to FairPrice AI Technologies, Hyderabad, Telangana, India.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white pb-16">
      <div className="hero-blue">
        <div className="container-page py-14 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Legal</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Terms of Service</h1>
          <p className="mt-3 text-white/75">
            Last updated: August 2026 · Effective immediately for new users
          </p>
        </div>
      </div>

      <div className="container-page py-10">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Quick nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">Sections</p>
              <nav className="space-y-1.5">
                {SECTIONS.map((s) => (
                  <a key={s.title} href={`#${s.title.replace(/\s+/g, "-")}`} className="block text-sm text-foreground-muted hover:text-primary transition-colors">
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <article className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>Note:</strong> These Terms constitute a legal agreement. By using FairPrice AI you agree to these Terms. Read carefully before proceeding.
            </div>

            <div className="space-y-10">
              {SECTIONS.map((s) => (
                <section key={s.title} id={s.title.replace(/\s+/g, "-")}>
                  <h2 className="font-display text-xl font-bold mb-3 text-foreground">{s.title}</h2>
                  <div className="text-sm leading-relaxed text-foreground-muted whitespace-pre-line">{s.body}</div>
                </section>
              ))}
            </div>

            <div className="mt-10 border-t border-border pt-6 flex flex-wrap gap-3">
              <Link href="/privacy" className="text-sm text-primary hover:underline">Privacy Policy</Link>
              <span className="text-foreground-muted">·</span>
              <Link href="/contact" className="text-sm text-primary hover:underline">Contact legal team</Link>
              <span className="text-foreground-muted">·</span>
              <Link href="/help" className="text-sm text-primary hover:underline">Help centre</Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
