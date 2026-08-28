# SponsorThis — Make anything sponsorable

A U.S.-first managed marketplace where brands sponsor lawful, consensual, venue-approved
real-world moments — people, events, vehicles, spaces, challenges, and stunts — sold as
packages with defined deliverables, timestamped proof, and payouts released only after
proof acceptance.

**Launch posture:** managed marketplace + activation studio, founder-led in Denver.
Supply is hand-curated, demand is founder-sold, software standardizes booking, payment,
deliverables, proof, and reporting. Self-service unlocks only after repeat buying behavior
is demonstrated. First revenue goal: **3–5 paid campaigns and ≥$5,000 cash in 30 days.**

> Everything in this repository is a pre-validation working plan plus a functional demo
> application. No interviews have been run, no campaigns sold, and all demo data is
> clearly fictional. Estimates are labeled with their methodology; legal documents are
> placeholders pending attorney review.

## Repository map

| Path | What it is |
|---|---|
| `docs/00-executive-decision-memo.md` | The thesis, red-team, GO recommendation, kill criteria |
| `docs/01–05` | Market research, category definition, wedge/ICP, business model, unit economics |
| `docs/06–08` | 30-day revenue plan, concierge operations playbook, marketplace design |
| `docs/09–12` | PRD, user flows/state machines, brand strategy, design system |
| `docs/13–16` | Trust & safety policy, technical architecture, data model + ERD, metrics |
| `docs/17–20` | Go-to-market, sales playbook (scripts/sequences), 30 scored launch stunts, city expansion |
| `docs/21–25` | Financial scenarios, risk register, kill/pivot/continue gates, investor narrative, launch runbook |
| `docs/DECISIONS.md` | **Canonical decision log — every number ties back to this** |
| `docs/ASSUMPTIONS.md` | Every material assumption, confidence, and falsifier |
| `docs/LEGAL-REVIEW-QUESTIONS.md` | 25 numbered questions for counsel (money flow, gambling adjacency, FTC, IP…) |
| `data/*.csv` | 12-month financial model, lead-list template, sample listings & campaigns |
| `app/` | The working Next.js application (below) |
| `kalshi-prototype/` | Pre-existing unrelated prototype, untouched |

## The application (`app/`)

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma + SQLite locally
(Postgres-compatible schema; documented Supabase production path) · mock payment adapter
modeling Stripe Connect semantics exactly (capture at booking → payout held → manual
release after proof acceptance; idempotent webhook events; refunds/partials) · cookie-
session auth with server-side RBAC (`BUYER`/`SELLER`/`ADMIN`).

What works end-to-end, locally, with zero external credentials:

- **Public:** editorial homepage, browse/search/filters, listing detail with three-tier
  packages and transparent fees, seller profiles, how-it-works, pricing, trust & safety +
  prohibited categories, FAQ, about, contact, labeled draft legal pages
- **Buyers:** signup/login, post a campaign brief, receive proposals, accept & book,
  checkout (simulated payment), campaign dashboard, proof review, revision requests,
  acceptance, disputes, reviews, rebooking, messaging
- **Sellers:** listing builder (with audience-estimate honesty rules), submit for
  moderation, go live/pause, campaign checklist, timestamped proof submission, earnings
  and payout status, reliability display
- **Admin (Ops Console):** marketplace overview metrics, listing moderation queue, brief
  matching + proposal sending, campaign state management, payments with manual payout
  release, refunds, dispute resolution (full/partial/release), venue-approval & permit
  tracking, audit log
- **Flagship seed listing:** *Sponsor Aaron at a $200 Denver Poker Tournament* — three
  packages ($450 / $750 / $1,500) with venue-approval gating, no-gambling-stake
  constraints, and full campaign lifecycle demo data

### Quickstart

```bash
cd app
npm install
cp .env.example .env        # defaults work out of the box for local dev
npx prisma migrate dev      # creates prisma/dev.db and applies migrations
npm run db:seed             # demo accounts + catalog + campaign lifecycle data
npm run dev                 # http://localhost:3000
```

Demo accounts (password `demo1234`):

| Email | Role |
|---|---|
| `admin@sponsorthis.demo` | Admin / concierge ops |
| `buyer@sponsorthis.demo` | Brand buyer (Peak Cold Brew) |
| `agency@sponsorthis.demo` | Agency buyer (Foothill Creative) |
| `seller@sponsorthis.demo` | Seller (Aaron — poker listing) |
| `seller2/3@sponsorthis.demo` | Additional sellers |

### Tests & checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # 34 Vitest tests: fees (D-008 numbers exactly), state machines,
                    # auth primitives, payment idempotency/refund/payout integration
npm run test:e2e    # 7 Playwright flows: browse, listing, full book→pay→campaign,
                    # admin console, authorization boundaries (reseeds the db first)
npm run build       # production build
```

(The remote build container preinstalls Chromium; locally set
`PLAYWRIGHT_CHROMIUM_PATH` or run `npx playwright install chromium` once.)

### Production path (documented, not yet provisioned)

Swap SQLite → Supabase Postgres (datasource change + migrate), wire real Stripe Connect
behind the existing `PaymentProvider` interface, move auth internals to Supabase Auth
behind `getSession()`, deploy to Vercel. Step-by-step in
`docs/14-technical-architecture.md`.

## Current status vs. Definition of Done

Complete: evidence-based thesis and wedge, $10k GMV plan, 3-scenario unit economics,
working responsive app (briefs, bookings, proof, moderation, payment/payout states), poker
listing demonstrated, brand system, T&S policy, sales/stunt playbooks, tests + typecheck +
lint + build passing, setup instructions, assumptions and legal questions documented.

Not done (by design, pre-validation): real interviews, real payments, real venue
approvals, deployment, and the name/trademark clearance — all queued in the 30-day plan
and legal questions.

## Ten highest-value next actions

Ranked by expected financial impact — detail in `docs/06` and `docs/25`:

1. Run the 20 buyer interviews (agencies first) and kill/keep the price points with data
2. Get one Denver venue's written approval for the poker activation (or execute the
   dog-walking fallback stunt)
3. Close the first 3 paid campaigns via founder outbound using `docs/18`'s sequences
4. Send the attorney `docs/LEGAL-REVIEW-QUESTIONS.md` (money flow + gambling adjacency
   + ToS are launch-blocking)
5. Stand up real payments: Stripe account, Connect Express onboarding, swap the adapter
6. Deploy to Vercel + Supabase and put the brief form behind a real domain
7. Curate the first 25 real Denver listings from the 25 seller interviews
8. Execute launch stunt #1 and convert it into the first public case study
9. Build the 100-prospect lead list and start the daily outbound cadence
10. Instrument the funnel (PostHog) and review contribution margin weekly against the
    day-10/20/30 gates in `docs/23`

---

*Working name **SponsorThis** is provisional pending trademark/domain clearance
(`docs/11-brand-strategy.md`). Tagline: **Make anything sponsorable.***
