import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy (draft)" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded border-2 border-danger bg-danger-soft p-4 font-bold text-danger">
        DRAFT PLACEHOLDER — NOT A PRIVACY POLICY. This outline requires attorney review before
        any real user data is collected. See docs/LEGAL-REVIEW-QUESTIONS.md.
      </div>
      <h1 className="headline mt-8 text-4xl">Privacy Policy (draft outline)</h1>
      <ol className="mt-8 list-decimal space-y-3 pl-6 text-sm">
        <li>Data collected: account details, profiles, listings, campaign records, payment metadata (processed by the payment provider, not stored as card data), proof media, messages, analytics events, audit logs.</li>
        <li>Purposes: operating the marketplace, payments, trust and safety, fraud prevention, support, legal compliance.</li>
        <li>Sharing: payment provider, service vendors, counterparties to a campaign (limited to what the campaign requires), legal requests.</li>
        <li>Retention, deletion, and access requests: TO BE SPECIFIED WITH COUNSEL (incl. state privacy-law obligations).</li>
        <li>No selling of personal data. No advertising trackers in the MVP.</li>
        <li>Minors: the service is 18+ only.</li>
        <li>Security practices and breach notification: TO BE SPECIFIED.</li>
      </ol>
    </div>
  );
}
