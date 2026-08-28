# 14 · Technical Architecture

Canon: D-011 (stack), D-012 (SQLite local / Supabase Postgres production), D-013
(payment abstraction), D-014 (auth), D-015 (state machines). This document describes the
repository as it actually is. Two labels are used throughout:

- **EXISTS** — in the repo today (`/app`), runnable locally with zero external credentials.
- **PLANNED** — designed and documented here, not yet built. Nothing marked PLANNED
  should be represented to anyone as existing.

Honest inventory of what EXISTS right now: the Prisma schema + initial migration
(`prisma/schema.prisma`, `prisma/migrations/…_init`), the domain library
(`src/lib/`: `auth.ts`, `password.ts`, `fees.ts`, `payments.ts`, `state-machines.ts`,
`campaigns.ts`, `audit.ts`, `db.ts`, `env.ts`, `format.ts`), the full transactional MVP UI
(~30 routes: public marketplace, browse/search, listing detail with booking, brief
submission, buyer dashboard + checkout + campaign lifecycle with proof review/revisions/
disputes/reviews/messaging, seller dashboard + listing builder + proof submission, and the
admin ops console: moderation, brief matching/proposals, campaign transitions, payments
with manual payout release and refunds, dispute resolution, venue-approval/permit
tracking, audit log), seed data (`prisma/seed.ts`: demo accounts, 7 listings, briefs,
proposals, campaigns at five lifecycle stages), and the test suites (34 Vitest unit +
integration tests in `tests/`; 7 Playwright e2e flows in `e2e/`). Sections below still
marked PLANNED (rate limiting, file uploads, Sentry, PostHog, real Stripe/Supabase
adapters, Vercel deploy) remain accurate — nothing marked PLANNED exists.

---

## 1. Stack (EXISTS)

- **Next.js (App Router) + TypeScript + React 19 + Tailwind CSS v4** (`package.json`:
  next 16.x, react 19.x, `@tailwindcss/postcss` v4).
- **Prisma ORM** (`@prisma/client` 6.x) with a singleton client in `src/lib/db.ts`.
- **Zod 4** for validation.
- Tooling: ESLint 9 + `eslint-config-next`, Vitest 4 and Playwright installed (suites
  PLANNED), `tsx` for scripts.
- Deploy target: **Vercel** (§14).

Note: this repo's Next.js version has breaking changes vs. older docs — per
`/app/AGENTS.md`, consult `node_modules/next/dist/docs/` before writing app code.

## 2. Database: SQLite locally, Supabase Postgres in production (D-012)

**EXISTS:** `datasource db { provider = "sqlite" }` with `DATABASE_URL` (e.g.
`file:./dev.db`). The schema is deliberately written Postgres-compatible (Assumption A-17).

**SQLite compromises in the current schema, and how they harden on Postgres:**

| Compromise today | Why | Hardening on Postgres |
|---|---|---|
| All state/role fields are `String` pseudo-enums (`User.role`, `Listing.state`, `Campaign.state`, `Payment.status`, …) | SQLite + Prisma does not support `enum` | Convert to native Prisma `enum` types; invalid values become impossible at the DB layer instead of only at the app layer |
| Allowed values enforced only in `src/lib/state-machines.ts` + Zod at boundaries | Same | Keep the state machine as the *transition* authority; enums add *value* integrity beneath it |
| `AnalyticsEvent.props`, `WebhookEvent.payload` are `String` JSON | SQLite has no `Json` Prisma type | Migrate to `Json`/`jsonb`; enables indexing and querying on properties |
| No partial/expression indexes, limited concurrency | SQLite | Add the indexes in `15-data-model.md` §5; Postgres MVCC removes writer serialization |

**Swap procedure (PLANNED, config-level not rewrite-level):**

1. Create the Supabase project; take the Postgres connection string (use the pooled
   connection string for serverless/Vercel, plus `directUrl` for migrations).
2. In `schema.prisma`: `provider = "postgresql"`, add `directUrl = env("DIRECT_URL")`.
3. Optionally convert pseudo-enums to real enums in the same change (recommended — do it
   at swap time so there is exactly one migration discontinuity).
4. Prisma migration history is provider-specific: **regenerate migrations for Postgres**
   (`prisma migrate diff` from empty → current schema, or baseline with
   `prisma migrate dev` on a fresh Postgres DB). Do not replay the SQLite migration folder
   against Postgres.
5. Set `DATABASE_URL`/`DIRECT_URL` in Vercel env; run `prisma migrate deploy` in CI.
6. If demo data must move: export via a `tsx` script reading SQLite and writing through
   Prisma to Postgres (row counts are tiny at this stage).

## 3. Auth (D-014)

**EXISTS** in `src/lib/auth.ts`:

- Passwords hashed with Node `crypto.scryptSync` (16-byte random salt, 64-byte key,
  stored `salt:hash`); constant-time comparison via `timingSafeEqual`.
- Sessions: HMAC-SHA256-signed payload `{userId, exp}` (7-day TTL) in an HTTP-only,
  `SameSite=Lax` cookie `st_session`; `secure` in production. Secret from
  `env.SESSION_SECRET` (see §13).
- `getSession()` re-reads the user from the DB on every call — role changes and deleted
  users take effect immediately; the cookie carries identity only, never role.
- `requireRole(...roles)` is the single server-side guard for route handlers and server
  actions; it throws typed `AuthError` (401/403). **No authorization decision lives in
  client code.**

**PLANNED — Supabase Auth swap path:** replace the internals of `getSession()` /
`setSessionCookie()` with Supabase Auth (`@supabase/ssr`), keep the `SessionUser`
shape and `requireRole` untouched. Callers never touch cookies directly today, so the
seam is real. Password migration: Supabase admin API import, or lazy re-hash at first
login (scrypt hashes are verifiable during a transition window).

Known limitation (accepted for MVP, fix at Supabase swap): HMAC cookie sessions are
stateless — there is no server-side revocation list, so "log out everywhere" waits for
TTL expiry unless we rotate `SESSION_SECRET` (which logs out everyone).

## 4. Payments: PaymentProvider abstraction + MockStripeConnectProvider (D-013)

**EXISTS** in `src/lib/payments.ts`: a `PaymentProvider` interface (`authorize`,
`capture`, `refund`, `releasePayout`) with a mock adapter; domain functions
`chargeForCampaign`, `refundCampaign`, `releasePayoutForCampaign`. No real Stripe keys or
SDK are in the repo; **no real money moves anywhere in the MVP.**

### 4.1 Mock ↔ real Stripe Connect mapping

| Mock today | Real Stripe Connect object/state |
|---|---|
| `authorize(amount, idempotencyKey)` → `mock_pi_*`, status `AUTHORIZED` | `PaymentIntent` created+confirmed with `capture_method: manual` → `requires_capture`; Stripe idempotency key on create |
| `capture(externalId)` | `PaymentIntent.capture()` → `succeeded`; funds settle to the **platform** balance |
| `Payment.status` `REQUIRES_PAYMENT → AUTHORIZED → CAPTURED → (PARTIALLY_)REFUNDED / FAILED` | PaymentIntent `requires_payment_method → requires_capture → succeeded` + `Refund` objects (partial/full) / `payment_failed` |
| `releasePayout(acctId, amount)` → `mock_tr_*` | `Transfer` to the connected account (`transfer.created`), then Stripe pays out per the connected account's payout schedule (`payout.paid`) |
| `Payout.status` `HELD → RELEASED → PAID / CANCELED` | HELD = funds sitting in platform balance, no transfer yet; RELEASED = transfer created; PAID = payout to seller bank confirmed. (Mock marks PAID immediately; Stripe emits it later via webhook.) |
| `refund(externalId, amount)` | `Refund` on the PaymentIntent/charge |
| `WebhookEvent` rows written by the mock | Real webhook deliveries (`payment_intent.succeeded`, `charge.refunded`, `transfer.created`, `payout.paid`, …) |
| `PayoutAccount` (`ONBOARDING → ACTIVE → RESTRICTED`) | Connect **Express** account: onboarding link flow; `charges_enabled`/`payouts_enabled`; `requirements.disabled_reason` ↔ RESTRICTED |

### 4.2 Charge type: recommend **separate charges and transfers**

Stripe offers destination charges (charge + transfer in one call) and separate charges and
transfers (charge to the platform now, transfer to the connected account later, decoupled
in time). Reference: https://docs.stripe.com/connect/charges

**Recommendation: separate charges and transfers.** Reasoning:

1. Our flow *is* decoupled: capture at booking, release payout only after proof acceptance
   (`ACCEPTED → PAYOUT_RELEASED`, admin-only). Separate transfers map 1:1 — `HELD` is
   simply "no transfer created yet"; `releasePayout` is `stripe.transfers.create(...)`.
   The mock already behaves this way even though D-013 describes it loosely as
   "destination-charge semantics" — the semantics that matter (capture to platform,
   manual later release) are the separate-charges shape.
2. Refunds before release stay trivial: money is still in the platform balance; no transfer
   reversal needed. With destination charges the transfer exists from the moment of
   charge, so every pre-delivery refund needs a transfer reversal too.
3. It matches our fee math: we charge buyer total (price + 5% fee) to the platform and
   transfer exactly `sellerPayoutCents` (80% of price), keeping the platform fee without
   `application_fee_amount` gymnastics.

Costs of this choice, accepted: with either indirect charge type the **platform is the
merchant of record — responsible for refunds, disputes/chargebacks, and any negative
balances** (per Stripe's Connect charge documentation, above). Loss-of-Stripe's
same-currency/same-region transfer constraints are fine for a US-only launch.

**Negative-balance risk:** if we refund a buyer *after* the payout was released, the
platform is out the money unless we reverse the transfer (`transfer.createReversal`) —
which fails in practice if the seller has already been paid out and has no balance. Policy:
post-release refunds are funded from the platform reserve (A-09: 5% of GMV) and clawed
back from the seller's future payouts contractually; disputes are therefore resolved
**before** release whenever possible (the state machine enforces this — payout release is
unreachable while `DISPUTED`).

### 4.3 Financial responsibility summary

- Platform absorbs card processing (modeled 2.9% + $0.30 — Stripe's published standard
  US online card rate; verify at contract time per A-08. Source:
  https://docs.stripe.com/pricing — modeled constants live in `src/lib/fees.ts`).
- Platform absorbs payout costs (modeled 0.25% + $0.25).
- Platform bears chargeback risk and post-payout refund risk (reserve per A-09).
- Fee math is centralized in `computeFees()` (`src/lib/fees.ts`): buyer pays price + 5%;
  seller receives 80% of price; platform gross = buyer total − seller payout; $250 minimum
  enforced. All money is integer cents.

## 5. Webhook idempotency & reconciliation

**EXISTS:** `WebhookEvent` uses the **provider event id as primary key** — inserting a
replayed event violates the PK and the handler no-ops (`recordProviderEvent` catches the
conflict). `MockStripeConnectProvider.authorize` additionally uses the idempotency key as
the event id, so a retried checkout returns the same `externalId` instead of
double-charging. `chargeForCampaign` is idempotent at the domain level too: an existing
non-`FAILED` payment short-circuits.

**PLANNED (production):** the Stripe webhook route verifies signatures
(`stripe.webhooks.constructEvent`), inserts `event.id` into `WebhookEvent` first (PK
conflict → 200 and stop), then applies state. Reconciliation: a nightly job lists Stripe
PaymentIntents/Transfers/Payouts for the day and diffs against `Payment`/`Payout` rows;
mismatches create `RiskFlag(entityType=CAMPAIGN)` rows for admin review. Webhooks are
treated as delivery hints; Stripe's API is the source of truth on conflict.

## 6. RBAC matrix (D-014, D-015)

Roles: `BUYER | SELLER | ADMIN` (per-user, `User.role`; org membership adds
`OWNER|MEMBER` scoping within a buyer org). Enforced via `requireRole` plus per-row
ownership checks; state transitions additionally role-checked in `state-machines.ts`.

| Resource | BUYER | SELLER | ADMIN |
|---|---|---|---|
| Listing (own) | — | create/edit DRAFT, submit, pause/relist | full, incl. moderation transitions |
| Listing (others', LIVE) | view, book | view | full |
| Listing moderation queue | — | — | review/approve/reject/request changes |
| Brief | create/view own org's | — | view all |
| Proposal | view/accept/decline for own briefs | create/withdraw own | full |
| Campaign | view own org's; transitions marked BUYER in the machine (checkout, accept proof, open dispute…) | view own; transitions marked SELLER (submit proof, start production…) | all transitions marked ADMIN (approve, refund, resolve dispute, release payout) |
| Payment/Refund | view own | — | initiate refunds |
| Payout | — | view own | release (`ACCEPTED→PAYOUT_RELEASED` is ADMIN-only) |
| Dispute | open/view own | open (from REVISION_REQUESTED)/view own | resolve |
| Messages | own campaigns | own campaigns | all |
| Reviews | author on own completed campaigns (1 per campaign per author, DB-unique) | author on own | moderate |
| VenueApproval/Permit queues | — | view own listings' | update statuses |
| RiskFlag/ModerationAction/AuditLog | — | — | full |
| Users/orgs admin | — | — | full |

The transition tables in `src/lib/state-machines.ts` are the executable, unit-testable
form of the campaign/listing columns above.

## 7. Input validation

**EXISTS:** Zod 4 is the validation layer; `env.ts` demonstrates the pattern. Schema
comment codifies the rule: *all state/role strings are validated with Zod at every
boundary* since SQLite cannot enforce enums. **PLANNED:** one Zod schema module per
route handler/server action (parse `formData`/JSON before any DB call; `priceCents` etc.
as `z.number().int().positive()`), rejecting unknown keys.

## 8. Rate limiting — NOT YET IMPLEMENTED

There is **no rate limiting in the MVP today**. Acceptable only while the app is demo/
concierge-operated. Production plan (PLANNED): Next.js middleware backed by Upstash
Redis (`@upstash/ratelimit`, sliding window) keyed by IP + session user id; strict tiers on
`POST /login`, signup, and message/brief creation (e.g. 5/min auth attempts, 30/min
writes); generous read tier. Vercel WAF/bot rules layered in front. Login additionally gets
per-account exponential backoff to blunt credential stuffing.

## 9. File uploads

**EXISTS:** none. `ListingMedia.url` and `ProofSubmission.url` store URLs; demo content
uses static/demo images. **PLANNED:** Supabase Storage buckets (`listing-media`,
`proofs`), client uploads via short-lived signed upload URLs from a server action;
private-by-default `proofs` bucket served through signed GET URLs; size/MIME allowlists;
EXIF capture-time retained on proof images (supports §9 of the T&S doc).

## 10. Error monitoring — Sentry slot (PLANNED)

Nothing is wired today. Plan: `@sentry/nextjs` with server + client config, release tagging
from the Vercel commit SHA, PII scrubbing on (no emails in events), alert rule to founder
on first-seen errors in payment/payout code paths.

## 11. Analytics events

**EXISTS:** `AnalyticsEvent` table (`name`, optional `userId`, JSON-string `props`) and a
`track()` helper in `src/lib/audit.ts`. That is the entire pipeline today — first-party,
in-DB. **PLANNED:** PostHog (US cloud) added as a second sink behind the same `track()`
call once there is real traffic; the event taxonomy is fixed now in
`16-analytics-and-metrics.md` §5 so history stays comparable. Admin analytics *page* is
PLANNED (queries in doc 16); the data layer for it EXISTS.

## 12. Feature flags

**EXISTS:** none (and no third-party flag service). Approach for MVP scale: a typed
`src/lib/flags.ts` constants module (flags are code-reviewed booleans, changed by deploy),
env-var overrides for the few runtime toggles (e.g. `FLAG_SELF_SERVE_CHECKOUT`).
Re-evaluate a real service (PostHog flags, since it's already planned for analytics) only
when there are non-founder operators. PLANNED, deliberately boring.

## 13. Environment validation

**EXISTS:** `src/lib/env.ts` — Zod-parsed at import time, fails fast: `DATABASE_URL`
required; `SESSION_SECRET` min 16 chars with a dev-only default that **hard-fails in
production** if unchanged; `NODE_ENV` enum. New secrets (Stripe keys, Supabase URLs,
Sentry DSN) must be added to this schema, never read from `process.env` directly.

## 14. Migrations, backup & recovery runbook

- **Migrations:** `prisma migrate dev` locally (SQLite, history in `prisma/migrations/`);
  after the Postgres swap, `prisma migrate deploy` runs in CI against `DIRECT_URL` before
  the Vercel promote. Never edit an applied migration; roll forward.
- **Backups (local/demo):** `dev.db` is disposable; reseed. **(production/Supabase):**
  Supabase automated daily backups on paid plans + PITR where enabled; weekly logical
  dump (`pg_dump`) to founder-controlled storage as an off-provider copy.
- **Recovery drill (quarterly):** restore latest dump to a scratch Supabase project, run
  the app against it, verify a campaign's full money trail (`Payment` → `Refund`s →
  `Payout` → `AuditLog`) reconciles. Money-truth note: Stripe is an independent record —
  after any restore, run reconciliation (§5) before releasing further payouts.

## 15. Deployment to Vercel (PLANNED — not yet deployed)

1. Push repo to GitHub; import `/app` as the Vercel project root.
2. Set env vars: `DATABASE_URL` (Supabase pooled), `DIRECT_URL`, `SESSION_SECRET`
   (generated, ≥32 chars), later `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Sentry DSN.
3. Complete the §2 datasource swap first — SQLite does not work on Vercel's ephemeral
   filesystem; the Postgres swap is a **precondition** of deploy, not an optimization.
4. Build: `prisma generate && next build`; migrations via `prisma migrate deploy` in the
   build step or a pre-promote CI job.
5. Preview deployments per PR (against a Supabase branch or scratch DB, never prod).
6. Custom domain + HTTPS via Vercel; cookie `secure` flag already keys off `NODE_ENV`.
7. Post-deploy smoke: signup → list → moderate → book (mock pay) → proof → release.

## 16. Security review checklist

Before real users, and re-run before real money:

- [ ] All mutating routes call `requireRole` and verify row ownership (no IDOR).
- [ ] Every state mutation goes through `transitionCampaign`/`assert*Transition` — grep
      for direct `state:` updates in route code.
- [ ] Zod parse on every request body/form/search param; unknown keys rejected.
- [ ] `SESSION_SECRET` rotated from dev default; production hard-fail verified (env.ts).
- [ ] Session cookie: HttpOnly, Secure, SameSite=Lax confirmed in prod response headers.
- [ ] CSRF posture: mutations via server actions/same-site POSTs only; no
      state-changing GETs.
- [ ] Rate limiting live on auth + write endpoints (§8) — currently a known gap.
- [ ] No secrets in client bundles (`NEXT_PUBLIC_` audit); no service-role Supabase key
      anywhere near the browser.
- [ ] Stripe webhook signature verification + `WebhookEvent` PK dedupe tested with replay.
- [ ] Refund paths cannot exceed captured amount (unit test on `refundCampaign`) and
      payout release is unreachable from `DISPUTED` (state-machine test).
- [ ] SQL injection: Prisma parameterized only; no `$queryRawUnsafe`.
- [ ] Uploaded-file MIME/size validation; proof bucket private with signed URLs.
- [ ] Dependency audit (`npm audit`, Dependabot) clean of criticals.
- [ ] Backups restorable (last drill date recorded); reconciliation job green.
- [ ] AuditLog rows written for every admin money action (spot-check).

## Open questions

- Do we convert pseudo-enums to native Postgres enums at swap time (recommended above)
  or keep strings + CHECK constraints for easier value evolution? Decide before the swap
  migration is authored.
- Pooled-connection limits on Vercel serverless vs. Prisma: whether we need Supabase's
  transaction-mode pooler settings or Prisma Accelerate at expected load (trivial now).
- Whether payout release should require a second admin confirmation (four-eyes) once
  real money is live, given founder-only ops today.
- Stripe negotiated pricing vs. modeled constants in `fees.ts` — revisit A-08 at
  integration time and update `PROCESSING_RATE` if actual terms differ.
