# SponsorThis — web application

The transactional MVP for SponsorThis: a managed marketplace for real-world
sponsorships. See the repository root `README.md` for the business context and full
documentation map, and `../docs/14-technical-architecture.md` for the architecture.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Prisma 6 + SQLite
(local) with a Postgres-compatible schema for Supabase in production · Zod validation ·
Vitest (unit/integration) · Playwright (e2e) · ESLint.

## Local setup

```bash
npm install
cp .env.example .env      # local defaults are fine
npx prisma migrate dev    # create + migrate prisma/dev.db
npm run db:seed           # demo accounts, catalog, campaign lifecycle data
npm run dev               # http://localhost:3000
```

Demo accounts all use password `demo1234`: `admin@sponsorthis.demo`,
`buyer@sponsorthis.demo`, `agency@sponsorthis.demo`, `seller@sponsorthis.demo`,
`seller2@sponsorthis.demo`, `seller3@sponsorthis.demo`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest — fee math, state machines, auth primitives, payment idempotency/refunds/payouts (against `prisma/test.db`) |
| `npm run test:e2e` | Playwright — reseeds the db, boots the prod server on :3105, runs 7 flows |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Reset + reseed demo data (idempotent) |

## Architecture notes

- **State machines** (`src/lib/state-machines.ts`): every listing/campaign state change in
  the app goes through role-checked transition tables; illegal moves throw. Unit-tested.
- **Money** (`src/lib/fees.ts`, `src/lib/payments.ts`): integer cents everywhere; 5% buyer
  fee, 80% seller payout, $250 minimum. The mock payment provider models Stripe Connect
  (authorize → capture → refund/partial; payout held → released → paid; idempotent
  provider events keyed on `WebhookEvent.id`). Payouts release manually, only from
  campaigns in `ACCEPTED` state.
- **Auth** (`src/lib/auth.ts`): scrypt password hashes, HMAC-signed HTTP-only session
  cookies, `requireRole()` guards in every server action — no client-only authorization.
- **Environment** (`src/lib/env.ts`): Zod-validated at boot; production refuses the dev
  session secret.
- **Seed** (`prisma/seed.ts`): fictional demo data only, labeled as such in the UI.

## Production path

Documented step-by-step in `../docs/14-technical-architecture.md`: Supabase Postgres
(datasource swap + migrate), Supabase Auth behind the `getSession()` seam, real Stripe
Connect behind the `PaymentProvider` interface, Supabase Storage + signed URLs for proof
uploads, rate limiting, Sentry, PostHog, Vercel deploy.
