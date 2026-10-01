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

## Portfolio endpoints

- `GET /api/v1/portfolio/overview` returns summary totals, holdings, and ordered transactions.
- `POST /api/v1/import/trades` accepts multipart form data with a CSV in the `file` field.
- `POST /api/v1/import/reset` restores the supplied sample trade history.

Example import:

```bash
curl -F "file=@data/trades.csv" http://localhost:1113/api/v1/import/trades
```

## Calculation rules

The calculation engine uses weighted-average cost per asset across exchanges:

- BUY cost is `quantity * price + fee`.
- SELL cost removed is `average cost before sale * sold quantity`.
- SELL realized P&L is `quantity * price - fee - cost removed`.
- A full close resets remaining quantity and cost basis to exact zero before a later BUY.
- Unrealized P&L is `current value - remaining cost basis`.
- Total P&L is `realized P&L + unrealized P&L`; fees are already reflected and are not deducted twice.

All arithmetic uses `decimal.js` with 40 significant digits. API values are returned as decimal strings without display rounding. Formatting and rounding belong to the presentation layer.

## Import behavior

Imports validate the complete file before changing state. Validation covers required and duplicate columns, unique trade IDs, UTC timestamps, supported enum values, positive quantity and price, non-negative fees, CSV syntax, and chronological short-position prevention. Errors include row, field, code, and an actionable message.

The current implementation stores the active dataset in process memory. A restart restores the supplied sample data. This keeps the assessment deployment stateless; durable or per-user persistence can be added later without changing the calculation engine.
