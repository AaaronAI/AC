# Polymarket Slots

A slot machine for prediction markets. Set a bet, pick a couple of filters, pull
the lever. The machine screens live Polymarket order books, lands on a real
market it thinks you can actually get filled on, and offers you the bet — with a
hard price cap attached. You get points and a shareable card either way.

It's a gimmick. The screening underneath it is not.

## The idea

A random market is a bad bet if the book is bad: a wide spread or a thin book
means you lose money on execution before the question is even resolved. So the
machine only ever lands on something that cleared a screen:

| Rule | Default | Why |
| --- | --- | --- |
| Spread | ≤ 3¢ | You pay half the spread the moment you enter |
| Slippage | ≤ 2¢ on **your** bet | Simulated by walking the real book, not guessed |
| Price band | 8¢ – 92¢ | Near-certainties and lottery tickets are boring |
| 24h volume | ≥ $5,000 | Someone else is trading it too |
| Liquidity | ≥ $2,000 | There's a real book, not one quote |
| Depth | ≥ 2× your bet near the touch | It can absorb you |
| Prices crossed | ≤ 2 levels | Your order doesn't eat down the book |

Bet size is part of the screen, not an afterthought — a book that's perfectly
fine for $5 can be untradeable at $100, and the same market is judged
differently as you change the amount.

Surviving candidates are then picked **weighted by book health**, so the machine
is random but not indifferent. Every spin shows its working: how many markets
matched, how many sides were screened, and exactly which rule rejected the rest.

Two of these are exposed to the player, because they're the two that change what
you actually pay:

**Widest spread (1¢ / 2¢ / 3¢ / 5¢, default 3¢).** You give up roughly half the
spread the moment you enter. At 5¢ that's 2.5¢ a share — on a 40¢ contract, over
6% gone before the question resolves. Tighter is stricter, and fewer markets
qualify.

**Prices crossed (1 / 2 / 3, default 2).** How far your order may eat into the
book. One price means the whole stake fills at the best ask and slippage is zero
by construction — if it doesn't all fit at the touch, the market is skipped. Each
extra level means later shares cost more than the price you were quoted. This is
the most legible depth measure available: it answers "is there enough resting at
the touch to take all of me?" without needing a dollar figure, and it scales with
your stake automatically.

Both are validated server-side against the offered values — a client asking for a
40¢ spread doesn't get one. Everything else lives in
[`lib/config.ts`](lib/config.ts).

## Look and feel

A vintage cabinet rather than a dark-mode web app: oxblood and brass, cream reel
faces with dark symbols, `Alfa Slab One` on the marquee and `DM Mono` for every
readout. The three reels land **one at a time** — the pause between them is the
only reason a slot machine feels like anything — and the result prints as a
perforated betting slip, which is the object people actually screenshot.

Reel symbols are drawn SVG (`components/CategoryMark.tsx`), not emoji, so they
render identically everywhere. Fonts are self-hosted from `public/fonts`, so
there's no build-time or runtime dependency on a font CDN. The share PNG needs
`.ttf` rather than `.woff2` — satori parses sfnt directly and can't read WOFF2.

The design deliberately commits to one look instead of following the viewer's
theme, so every colour is painted explicitly.

## Running it

```bash
npm install
cp .env.example .env.local
npm run dev
```

This runs against **live Polymarket** out of the box — discovery and order books
are public and need no key. Set `FIXTURE_MODE=1` to run on bundled sample markets
instead (no network, no wallet, no orders); about half those fixtures are
deliberately *bad* books, so you can watch the screen reject them.

**Check `/api/diagnose` on your first live run.** It reports, step by step,
whether Gamma is reachable, whether its response still has the fields we parse,
whether discovery returns anything at each horizon, and whether an order book
comes back — so a failure tells you which part broke instead of just showing an
empty machine.

```bash
npm test        # 41 tests over the book math, screening, scoring and spin
npm run build   # production build
```

## Placing a real bet

Execution is non-custodial. Your key never leaves your browser.

1. **Connect** a wallet on Polygon (chain 137).
2. **Sign once** to derive your Polymarket API credentials (CLOB L1 auth).
3. **Sign the order** — an EIP-712 signed order posted as fill-or-kill.

You need USDC on Polygon and a one-time approval for the exchange. The simplest
way to get both is to fund and place one trade at polymarket.com first.

If your funds sit in a **Polymarket proxy wallet** (which is what you have if you
signed up through their site) rather than directly in your EOA, switch the
dropdown to "Funds in my Polymarket wallet" and paste that address — orders are
then signed by your connected wallet but funded from the proxy.

### Where the price cap comes from

The book you were quoted on and the book your order lands in are not the same
book. So the order carries a limit price: the worst price the simulation
touched, plus a cent of headroom, snapped up to a legal tick. Your order can
fill **better** than quoted, never worse. If the book moves too far in between,
the order simply doesn't fill and you spin again — which is the correct outcome,
not a failure.

### How the proxy works

`/api/clob/[...path]` relays to `clob.polymarket.com`. The browser signs both the
order and the request auth headers; the server forwards bytes it cannot forge and
never sees your key or your API secret. It exists to avoid CORS and to keep rate
limiting in one place, and it's deliberately narrow — an allowlist of paths the
game actually uses, and only the headers the exchange needs.

Note that a proxy you don't control could still replay the auth headers it
relays. Deploy your own; don't point this at someone else's host.

## Reel artwork

Left reel is the joke, right reel is the odds; the middle one is the actual bet.
Neither side reel changes what gets screened — they're the cabinet's artwork, the
way cherries and BARs are.

The shipped set is drawn, not photographed: the sweater-verse on the left
(turtleneck, coiled scarf, glass of white, sandworm) and prediction-market
furniture on the right (probability curve, crystal ball, gavel, dice, a free
grocery storefront, an empty Oval Office armchair, a covered rent cheque).

To use your own images, drop files in `public/reels/` and list them in
[`lib/reels.ts`](lib/reels.ts) — see [`public/reels/README.md`](public/reels/README.md).
Worth reading the caution there before putting a real face on a reel.

## Who holds the shares

**Nobody here does.** This is deliberate and it's the most important design
decision in the project.

Orders are signed in your browser and filled on Polymarket's own exchange, so the
outcome tokens land directly in your Polymarket account. This app never takes
custody, never holds a float, and has no ability to move your positions. When the
market resolves, winning shares are worth $1.00 each and you redeem them at
[polymarket.com/portfolio](https://polymarket.com/portfolio) — the same as any
trade you'd place there yourself. You can also sell before resolution.

The alternative — pooling stakes, holding shares, paying people out on resolution
— would be materially worse. It means custodying other people's money, tracking
positions and settlement, and taking on the counterparty risk if anything goes
wrong. In most jurisdictions it also turns a gimmick into a regulated activity.
The non-custodial route avoids all of it, and the trade-off is small: players need
their own funded Polymarket account, and the app can't show a portfolio it doesn't
hold, so it links to theirs.

## Points

Scoring rewards daring and execution quality, deliberately **not** bet size —
stake contributes linearly and nothing else, so a well-executed $5 longshot beats
a $100 coin flip.

- **Longshot multiple** — `1/price`, capped at 8×
- **Clean fill** — up to +30% for near-zero slippage
- **Fast settle** — 1.5× under 24h, 1.25× under 48h
- **Streak** — +10% per consecutive spin, capped at 2×

Rarity (Common → Legendary) comes from how long the odds were, upgraded when the
fill was also clean. Progress is kept in `localStorage`; there's no account.

## Share cards

A card's entire contents are encoded into its URL, so links work forever with no
database and the deployment stores no record of anyone's bets. `/card/<data>`
renders the page; `/api/card?d=<data>` renders a 1200×630 PNG for link unfurls.

## Deploying

Vercel, with **root directory set to `polymarket-slots`**. Set `MAX_BET_USD`, and
make sure `FIXTURE_MODE` is *not* set in production unless you want a demo build.

## Layout

```
lib/orderbook.ts    walking the book: spread, depth, slippage, tick rounding
lib/eligibility.ts  the screen, and the 0-100 book health score
lib/gamma.ts        market discovery, defensive parsing, categorisation
lib/clob.ts         public order book reads
lib/spin.ts         discovery -> screening -> weighted pick -> quote
lib/points.ts       scoring, streaks, rarity
lib/fixtures.ts     deterministic offline markets, good and bad
lib/client/         wallet connection and in-browser order signing
app/api/spin        one pull of the lever
app/api/clob        narrow relay to the exchange
```

## Caveats

- **This is real money.** Randomly selecting a market is not a strategy. A tight
  book protects you from bad *execution*, not from a bad *bet*.
- Polymarket is geo-restricted and isn't available everywhere.
- Gamma's response shape drifts over time. Parsing is defensive and the horizon
  filter is re-checked locally, but if discovery ever returns nothing, start with
  `lib/gamma.ts`.
- Fill-or-kill means a moving book yields no fill rather than a bad one.
