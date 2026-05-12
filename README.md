# XRP Arbitrage Calculator

Browser-only, read-only XRP cross-exchange spread calculator. It ranks buy-venue → sell-venue opportunities by depth-weighted net spread after taker fees.

## Stack

- TypeScript + Vite
- Vanilla DOM UI, no React
- Tailwind CSS v4 via CSS import and Vite plugin
- Native `fetch` + `AbortController`
- Vitest unit tests

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build/test

```bash
npm test
npm run build
```

## Add a venue

1. Create `src/adapters/<venue>.ts`.
2. Export a `VenueAdapter` and a pure parser function.
3. Normalize into `OrderBook`: bids descending, asks ascending, numeric `[price, size]` levels.
4. Add the adapter to `src/adapters/index.ts`.
5. Add a fixture parser test under `tests/adapters/`.

## Known limitations

- Polling REST L2 books only; no WebSockets or local book reconstruction.
- Public CORS proxies are used only for global venues and can be unreliable.
- Stablecoin basis is labeled by quote currency, not adjusted.
- Fees are defaults and can be overridden in the UI; no authenticated fee tier lookup.
- No execution, balances, inventory, auth, persistence, or backtesting.
