import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trust & safety" };

const PROHIBITED = [
  "Illegal activities of any kind",
  "Dangerous challenges or activities likely to harm participants or bystanders",
  "Weapons",
  "Hate or extremist content",
  "Sexual services",
  "Harassment or targeting of individuals",
  "Controlled substances",
  "Tobacco and nicotine products",
  "Unlicensed gambling promotions",
  "Misleading health claims",
  "Financial promises or guaranteed-return claims",
  "Deceptive or undisclosed endorsements",
  "Political advertising (until a dedicated compliance system exists)",
  "Advertising directed toward children",
  "Unapproved use of third-party intellectual property",
  "Anything violating venue, event, or city rules — including trespass, vandalism, ambush marketing, and unpermitted installations",
];

export default function TrustSafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="headline text-4xl sm:text-6xl">Trust &amp; safety</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">
        Real-world sponsorship only works if every side can trust it: buyers, sellers, venues,
        and the public walking past. Safety is built into the product, not bolted on.
      </p>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-2xl font-extrabold">What every campaign requires</h2>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {[
              "All users are 18 or older",
              "Identity verification for sellers before payout",
              "Clear paid-sponsorship disclosure on all content",
              "Venue approval before branding is confirmed, when required",
              "Permit documentation, when required",
              "Content releases and defined usage rights",
              "Timestamped proof of completion",
              "Human moderation of every novel activation",
              "Payout held until the buyer accepts proof",
              "Audit logs on every state change",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="font-bold text-ok">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section id="prohibited">
          <h2 className="text-2xl font-extrabold">Prohibited campaigns</h2>
          <p className="mt-2 text-sm text-ink-soft">
            We decline these outright. Regulated categories not listed here may be evaluated
            later through a documented approval process — the default is no.
          </p>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {PROHIBITED.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="font-bold text-danger">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold">Disputes and refunds</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            If deliverables don&apos;t match the agreement, request a revision first — most issues
            resolve there. If not, open a dispute: the campaign pauses, payout stays held, and a
            human reviews the proof against the agreement. Outcomes can be a full refund, a
            partial refund, or payout release, and every decision is logged.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold">About payment protection</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Buyer payments are collected at booking and held by the platform; seller payouts
            release only after proof acceptance. We deliberately do not describe this as legal
            &quot;escrow&quot; — the exact structure is under attorney review, and we&apos;d rather be precise
            than impressive.
          </p>
        </section>
      </div>
    </div>
  );
}
