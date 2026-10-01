# AI Workflow

This file records selected examples of AI-assisted work. It will be expanded to 5-8 examples as implementation progresses.

## Example 1 - Requirement analysis and calculation baseline

### Goal and context

Understand the assessment, identify the required product scope, and establish expected numeric results before implementation.

### Prompt

> Phân tích yêu cầu này.

Context included `assessment.pdf`, `trades.csv`, and `prices.csv`.

### Agent response

The agent summarized functional and technical requirements, highlighted the weighted-average cost rules, inspected the supplied datasets, and produced expected portfolio totals for later regression testing.

### My review

I reviewed the proposed execution order and asked for concrete implementation steps before authorizing project creation.

### Outcome

Accepted as the planning baseline. The expected totals will be encoded in automated tests when the portfolio calculation module is implemented.

## Example 2 - BE/FE project initialization

### Goal and context

Initialize the repository using a directory structure similar to the supplied `bot-farm-be` and `bot-farm-fe` projects without copying unrelated business logic or secrets.

### Prompt

> tiến hành khởi tạo dự án cấu trúc thư mục tương tự dự án bot-farm be & fe

### Agent response

The agent inspected the reference projects, proposed separate `crypto-portfolio-be` and `crypto-portfolio-fe` applications, and scaffolded the backend module layers and frontend App Router structure.

### My review

Pending final review after installation and startup verification.

### Outcome

The scaffold is retained as the implementation foundation. Database, authentication, blockchain, and reference environment secrets were deliberately excluded because they are outside this assessment.

## Example 3 - Weighted-average calculation and CSV validation

### Goal and context

Implement the financial calculation engine and a complete, atomic CSV import boundary using the existing backend modules.

### Prompt

> triển khai calculation engine weighted-average và bộ validation CSV đầy đủ trong các module đã tạo

The implementation had to follow the supplied BUY/SELL fee rules, reject short positions, preserve calculation precision, and keep the previous dataset unchanged when an import failed.

### Agent response

The agent added a pure domain calculation module, CSV parsing and structured validation errors, an in-memory atomic portfolio store, import/reset endpoints, typed frontend contracts, and automated tests for the required edge cases and full sample dataset. The calculation engine uses plain inputs and outputs; HTTP error translation remains outside the domain layer.

### My review

The result was checked with lint and automated tests. The sample portfolio was reconciled to the expected value, cost basis, realized P&L, unrealized P&L, total P&L, and fee totals. Dependency audit also identified an affected CSV parser release, which was upgraded to a patched major version and retested.

### Outcome

Accepted after the parser security upgrade and repeat test pass. Financial values remain unrounded decimal strings in the API so display rounding cannot alter calculation state.

## Example 4 - Portfolio API boundary

### Goal and context

Expose a minimal backend boundary so the UI receives validated and fully calculated portfolio data without duplicating financial logic.

### Prompt

> Xây API/backend boundary
>
> GET /api/portfolio
> POST /api/import
> POST /api/reset

The backend had to read sample data, validate imports, run the calculation engine, and return an explicit typed result.

### Agent response

The agent added the three public routes, preserved the existing versioned routes for compatibility, introduced a runtime `PortfolioSnapshot` contract, updated the TypeScript frontend client, and added boundary tests for routes, sample loading, import, reset, missing files, and invalid responses.

### My review

The boundary was verified through automated tests and frontend type checking. The frontend API client was inspected to confirm it only requests calculated snapshots and contains no cost-basis or P&L formulas.

### Outcome

Accepted with the short `/api` routes as the stable UI boundary. The backend remains the only owner of CSV parsing, validation, and portfolio calculation.

## Example 5 - Responsive portfolio dashboard

### Goal and context

Build the first user-facing dashboard on top of the typed portfolio boundary while keeping every financial calculation in the backend.

### Prompt

> Xây dashboard
>
> Sáu summary cards, holdings table, price timestamp, loading, error và empty state, responsive layout. Lãi/lỗ cần có dấu, label hoặc icon; màu sắc chỉ là tín hiệu bổ sung. Headline metrics phải reconcile với holdings table.

### Agent response

The agent replaced the placeholder screen with six summary cards, a horizontally scrollable holdings table, a supplied-price timestamp, and dedicated loading, error/retry, and empty states. Gain and loss values use an explicit sign, directional icon, and text label in addition to color. Formatting is isolated from the API types, while every displayed cost and P&L value continues to come directly from one backend snapshot.

### My review

The implementation was checked at desktop and mobile breakpoints, including the loading skeleton and responsive table containment. The sample headline values were compared with the backend benchmark, and lint, production build, type checking, and the complete calculation/API test suite were rerun.

### Outcome

Accepted as the portfolio overview foundation. The frontend performs presentation formatting only; it does not recalculate weighted-average cost, realized P&L, unrealized P&L, total P&L, or fees.
