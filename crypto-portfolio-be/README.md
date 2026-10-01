# Crypto Portfolio API

Express API organized by feature modules, following the route/controller/service pattern used by the Bot Farm backend.

## Commands

```bash
npm run dev
npm test
npm run lint
npm run format
```

## Initial endpoints

- `GET /api/v1/health`
- `GET /api/v1/portfolio/capabilities`
- `GET /api/v1/import/requirements`

## Public portfolio API

- `GET /api/portfolio` returns calculated summary totals, holdings, and ordered transactions.
- `POST /api/import` accepts multipart form data with a CSV in the `file` field, validates the entire file, and returns the recalculated portfolio.
- `POST /api/reset` restores the supplied sample trade history and returns the recalculated portfolio.

Example import:

```bash
curl -F "file=@data/trades.csv" http://localhost:1113/api/import
```

The existing `/api/v1` endpoints remain available for backward compatibility. Financial calculations are performed only by the backend. The frontend consumes `PortfolioSnapshot` values and does not derive cost basis or P&L.

Before a snapshot crosses the API boundary, the backend verifies its explicit runtime contract. All monetary and quantity values are transported as decimal strings to avoid JSON number precision loss; the frontend mirrors this contract with TypeScript types.

## Calculation rules

The calculation engine uses weighted-average cost per asset across exchanges:

- BUY cost is `quantity * price + fee`.
- SELL cost removed is `average cost before sale * sold quantity`.
- SELL realized P&L is `quantity * price - fee - cost removed`.
- A full close resets remaining quantity and cost basis to exact zero before a later BUY.
- Unrealized P&L is `current value - remaining cost basis`.
- Total P&L is `realized P&L + unrealized P&L`; fees are already reflected and are not deducted twice.

All arithmetic uses `decimal.js` with 40 significant digits. API values are returned as decimal strings without display rounding. Formatting and rounding belong to the presentation layer.

The engine lives in `src/domain/portfolio` and is a pure domain module: it accepts plain trade and price objects, returns plain calculated objects, does not mutate its inputs, and has no dependency on Express, HTTP responses, UI code, filesystem access, stores, or databases. Domain errors are converted into HTTP-aware application errors only by the portfolio store boundary.

## Import behavior

Imports validate the complete file before changing state. Validation covers required and duplicate columns, unique trade IDs, UTC timestamps, supported enum values, positive quantity and price, non-negative fees, CSV syntax, and chronological short-position prevention. Errors include row, field, code, and an actionable message.

The current implementation stores the active dataset in process memory. A restart restores the supplied sample data. This keeps the assessment deployment stateless; durable or per-user persistence can be added later without changing the calculation engine.
