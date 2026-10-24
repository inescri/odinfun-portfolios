# Odin Portfolio

Multi-account holdings dashboard for [Odin](https://odin.fun). Connect as many Odin
logins as you want; every connected principal is stored in this browser's IndexedDB,
and the page shows one aggregated summary of all holdings on top plus per-account
token cards below.

## How it works

- **Login proof only.** `odin-connect` is used to prove you control a principal.
  `connect()` is called without `requires_api` / `requires_delegation`, so the SDK
  verifies the login (`POST /connect/verify`) but keeps the session in memory only.
  Once the principal is saved to IndexedDB the SDK session is dropped so the next
  account can be connected.
- **Public reads.** Holdings come from Odin's public API via the SDK
  (`/user/:principal/balances`, `/user/:principal/tokens`); no auth needed.
  The BTC/USD rate comes from `GET /currency/btc`.
- **Persistence.** IndexedDB database `odin-portfolio`: `accounts` (principal,
  username, image, addedAt) and `snapshots` (last fetched holdings per principal,
  shown instantly on reload while the live fetch runs).

To add a second account, switch account on odin.fun first: the Odin approval
window logs in as whoever is currently signed in there.

## Develop

```sh
pnpm install
cp .env.example .env   # optional; defaults to prod
pnpm dev
```

```sh
pnpm typecheck
pnpm test
pnpm build
```

## Config

| Variable             | Default          | Purpose                                            |
| -------------------- | ---------------- | -------------------------------------------------- |
| `VITE_ODIN_ENV`      | `prod`           | `prod` / `staging` / `dev` / `local` / `legacy`    |
| `VITE_ODIN_APP_NAME` | `Odin Portfolio` | Name shown on the Odin approval page               |
| `VITE_SITE_URL`      | _(empty)_        | Deployed `http(s)://` origin; enables `og:image`/`og:url` |

## Units

All amounts are `bigint` base units. Whole units = `balance / 10^(divisibility + decimals)`.
BTC is 8 + 3 (1 BTC = 1e11 millisats). `token.price` is millisats per whole token, so a
holding's value in millisats is `price * balance / 10^(divisibility + decimals)`.

## Social card

`public/og.png` (1200×630) is the static Open Graph / Twitter card. Source is
`scripts/og/card.html`; regenerate with `scripts/og/render.sh` (headless Chrome).
Title, description and `og:*` tags come from `src/brand.ts` via the plugin in
`vite.config.ts`, in both `vite dev` and `vite build`. `og:url`, `og:image` and
`twitter:image` need an absolute origin, so set `VITE_SITE_URL` (an `http(s)://`
URL; anything else fails the build). Without it those tags are omitted and the
Twitter card falls back to a text-only `summary`.

## Share card

The **Share** button in the header renders the aggregated portfolio to a
1200×630 PNG with the Canvas API, entirely in the browser (`src/lib/renderShareCard.ts`,
data shaped by `src/lib/shareCard.ts`). The dialog offers Download, Copy image
and, where the Web Share API accepts files (mobile browsers, Safari), the OS
share sheet. "Hide amounts" masks every value while keeping tokens, allocation
and 24h change. The card never includes principals or usernames. Token images
are fetched from the Odin CDN with CORS so they cannot taint the canvas; a
ticker-initial fallback is drawn when an image is unavailable.
