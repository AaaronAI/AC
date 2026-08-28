import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service (draft)" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded border-2 border-danger bg-danger-soft p-4 font-bold text-danger">
        DRAFT PLACEHOLDER — NOT LEGAL TERMS. This document is an outline for attorney review
        and has no legal effect. See docs/LEGAL-REVIEW-QUESTIONS.md in the repository.
      </div>
      <h1 className="headline mt-8 text-4xl">Terms of Service (draft outline)</h1>
      <ol className="mt-8 list-decimal space-y-3 pl-6 text-sm">
        <li>Eligibility: users must be at least 18; sellers must complete identity and payout verification before receiving funds.</li>
        <li>The marketplace relationship: SponsorThis is a platform connecting buyers and sellers; campaign agreements are between the parties, with SponsorThis providing booking, payment handling, and dispute procedures.</li>
        <li>Fees: buyer service fee (5%), platform fee (20% of package price deducted from seller payout), managed-campaign pricing as quoted.</li>
        <li>Payments and payouts: collection at booking; payout release after proof acceptance; refund and cancellation rules per listing policy; dispute procedure.</li>
        <li>Content and usage rights: content licenses per package terms; releases; third-party IP responsibilities.</li>
        <li>Conduct and prohibited categories: per the published Trust &amp; Safety policy; disclosure requirements for all sponsored content.</li>
        <li>Venue approvals and permits: seller responsibilities; consequences of failed approvals.</li>
        <li>Liability, indemnification, disclaimers, governing law: TO BE DRAFTED BY COUNSEL.</li>
        <li>Termination and enforcement; audit and moderation rights.</li>
      </ol>
    </div>
  );
}
