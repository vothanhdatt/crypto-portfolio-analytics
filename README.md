# Crypto Portfolio Analytics

Full-stack crypto portfolio analytics assessment, organized as two independent applications following the Bot Farm BE/FE structure.

## Projects

- `crypto-portfolio-be`: Express API with feature modules organized as route, controller, service, and validation layers.
- `crypto-portfolio-fe`: Next.js App Router frontend with feature components and a shared API client.

The `bot-farm-be` and `bot-farm-fe` directories are local references only and are intentionally ignored by Git.

## Contributing

Branch and commit conventions are documented in [CONTRIBUTING.md](./CONTRIBUTING.md). Do not implement changes directly on `main` or `develop`.

## Quick start

Backend:

```bash
cd crypto-portfolio-be
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd crypto-portfolio-fe
cp .env.example .env.local
npm install
npm run dev
```

The API defaults to `http://localhost:1113`; the frontend defaults to `http://localhost:3002`.

The frontend consumes the following calculated backend boundary:

```text
GET  /api/portfolio
POST /api/import
POST /api/reset
```

Portfolio cost basis and P&L are never calculated in the frontend.

## Testing

After installing the backend dependencies, run the complete automated test suite from the repository root with one command:

```bash
npm test
```

The suite covers weighted-average BUYs, BUY and SELL fees, partial and full closes, reopened positions, short-position rejection, CSV validation, import atomicity, missing prices, allocation reconciliation, input-order independence, and the complete sample-data benchmark.

## Status

The project includes a Decimal-based weighted-average calculation engine, complete CSV validation, atomic trade import/reset, typed frontend API contracts, and benchmark tests against the supplied 200 transactions. The responsive portfolio dashboard now presents six reconciled summary metrics, valuation time, accessible gain/loss signals, current-value allocation, per-asset realized/unrealized P&L charts, the calculated holdings breakdown, and a filterable transaction explorer. Import controls are the next implementation milestone.
