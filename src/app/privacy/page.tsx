import Link from "next/link";

const SECTIONS = [
  {
    title: "1. Who we are",
    body: `FairPrice AI Technologies ("Company", "we", "us") operates FairPrice AI, an AI-powered marketplace platform for buying and selling second-hand goods in India. We are committed to protecting your personal data in accordance with India's Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable regulations.

For privacy questions, contact: privacy@fairprice.ai`,
  },
  {
    title: "2. Data we collect",
    body: `We collect the following categories of personal data:

Identity data: name, display name, email address, mobile number, and government ID metadata (for verification — not stored raw).

Usage data: listings you create or view, searches, messages sent, offers made, and navigation patterns within the Platform.

Device data: IP address, browser type, device fingerprint, and operating system.

Location data: city and approximate location (for listing relevance and fraud detection). We do not collect precise GPS coordinates without explicit permission.

Payment data: transaction amounts, payment reference IDs from payment processors. We do not store full card numbers or UPI credentials.

Biometric data: face images used for identity verification. These are processed in memory by Gemini AI and immediately discarded. We store only the verification outcome (pass/fail), timestamp, risk classification, and consent record.

Communications: messages between buyers and sellers on the Platform, subject to moderation for safety.`,
  },
  {
    title: "3. How we use your data",
    body: `We use your personal data to:
• Operate and deliver Platform features (listings, valuations, chat)
• Verify your identity and prevent fraud
• Personalise search results, price estimates, and recommendations
• Send transactional notifications (OTP, listing status, offers)
• Monitor for prohibited conduct and enforce our Terms of Service
• Comply with legal obligations under Indian law
• Improve our AI models and valuation engine using anonymised, aggregated data

We do not use your personal data for advertising profiling, sell it to third parties, or use it for purposes unrelated to the Platform.`,
  },
  {
    title: "4. Legal basis for processing",
    body: `Under the DPDP Act 2023, we process your personal data on the following grounds:
• Consent: biometric processing for face verification, optional personalisation features
• Contract: data necessary to provide the services you have signed up for
• Legitimate interest: fraud detection, platform security, product improvement
• Legal obligation: compliance with RBI, CERT-In, and other regulatory requirements

You may withdraw consent for biometric processing at any time from Settings → Privacy. Withdrawal does not affect the lawfulness of prior processing.`,
  },
  {
    title: "5. Biometric data and face verification",
    body: `Face verification is used to reduce fraud and verify that users are real people. Here is exactly what happens:

1. Your selfie image is captured in your browser and sent to our server over HTTPS.
2. The image is passed to Google's Gemini AI API for analysis (face detection, liveness check).
3. The result (pass/fail, confidence score) is returned to our server.
4. The original image is immediately discarded from memory — it is never written to disk or stored in any database.
5. We record: verification outcome, timestamp, risk classification, session ID, and your consent record.

No raw biometric data is retained beyond the active verification session. We retain only derivative metadata.

You may view your verification history and withdraw biometric processing consent from Settings → Privacy → Consent & history.`,
  },
  {
    title: "6. Data sharing",
    body: `We share your personal data only as follows:

Service providers: Google Gemini AI (face verification and product identification), cloud hosting providers, payment processors, and SMS gateway — all subject to data processing agreements.

Legal requirements: We may disclose personal data to comply with court orders, government directives, or requests from law enforcement under applicable Indian law.

Business transfers: In the event of a merger, acquisition, or asset sale, your data may be transferred to the successor entity under equivalent privacy protections.

We do not sell personal data to third parties.`,
  },
  {
    title: "7. Data retention",
    body: `We retain personal data for as long as your account is active or as required by law. Specifically:

Account data: retained for the duration of your account and up to 3 years after deletion (for legal/fraud purposes).

Verification metadata (outcomes, timestamps): retained for up to 365 days per applicable regulations.

Biometric capture images: zero retention — discarded immediately after processing.

Messages and transaction records: retained for up to 7 years to comply with Indian financial regulations.

You may request deletion of your account and personal data from Settings → Privacy. Some data may be retained in anonymised or aggregated form.`,
  },
  {
    title: "8. Your rights under DPDP Act 2023",
    body: `As a Data Principal under the DPDP Act 2023, you have the following rights:

Right to access: Request a copy of the personal data we hold about you.

Right to correction: Request correction of inaccurate or incomplete personal data.

Right to erasure: Request deletion of your personal data, subject to legal retention obligations.

Right to grievance redressal: Lodge a complaint with our Data Protection Officer or the Data Protection Board of India.

Right to withdraw consent: Withdraw consent for specific processing activities at any time.

Nominee: Designate a nominee to exercise these rights on your behalf in the event of incapacity or death.

To exercise any of these rights, contact privacy@fairprice.ai. We will respond within 30 days.`,
  },
  {
    title: "9. Security",
    body: `We implement appropriate technical and organisational measures to protect your personal data, including:
• TLS/HTTPS encryption for all data in transit
• AES-256 encryption for sensitive data at rest
• Hashed passwords (bcrypt) — we never store plaintext passwords
• Rate limiting, HMAC-signed webhooks, and fraud detection on all sensitive flows
• Regular security reviews and vulnerability assessments

No security system is infallible. Please notify us immediately at security@fairprice.ai if you discover any security vulnerability.`,
  },
  {
    title: "10. Cookies and tracking",
    body: `We use session cookies and local storage for authentication and user preferences only. We do not use third-party advertising cookies, tracking pixels, or cross-site tracking technologies.

You may clear cookies at any time through your browser settings. Clearing authentication cookies will log you out of the Platform.`,
  },
  {
    title: "11. Children's privacy",
    body: `FairPrice AI is not intended for use by individuals under 18 years of age. We do not knowingly collect personal data from minors. If we become aware that we have collected data from a minor, we will delete it promptly. Parents or guardians who believe their child has used the Platform should contact us at privacy@fairprice.ai.`,
  },
  {
    title: "12. Cross-border data transfers",
    body: `Your personal data is primarily stored on servers in India. For services provided by Google (Gemini AI), data may be processed on Google's infrastructure outside India. Google operates under Standard Contractual Clauses and applicable international data transfer frameworks. We ensure that all cross-border transfers are subject to equivalent privacy protections.`,
  },
  {
    title: "13. Changes to this policy",
    body: `We may update this Privacy Policy from time to time. Material changes will be communicated via in-app notification or email at least 14 days before taking effect. Continued use of the Platform after the effective date constitutes acceptance of the updated policy.`,
  },
  {
    title: "14. Contact and grievance",
    body: `Data Protection Officer / Grievance Officer:
FairPrice AI Technologies
Email: privacy@fairprice.ai
Address: Hyderabad, Telangana, India

You may also lodge a complaint with the Data Protection Board of India (once constituted under the DPDP Act 2023) if you believe your rights have been violated.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white pb-16">
      <div className="hero-blue">
        <div className="container-page py-14 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Legal</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-3 text-white/75">
            Last updated: August 2026 · Compliant with DPDP Act 2023 (India)
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
            <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <strong>Summary:</strong> We collect only what we need, never sell your data, and immediately discard any face images after verification. Your rights under India&apos;s DPDP Act 2023 are fully honoured.
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
              <Link href="/terms" className="text-sm text-primary hover:underline">Terms of Service</Link>
              <span className="text-foreground-muted">·</span>
              <Link href="/verify/history" className="text-sm text-primary hover:underline">Consent & verification history</Link>
              <span className="text-foreground-muted">·</span>
              <Link href="/settings/privacy" className="text-sm text-primary hover:underline">Privacy settings</Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
