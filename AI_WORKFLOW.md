# AI Workflow

This document records eight representative uses of AI during the project. AI output was treated as a proposal: code and recommendations were reviewed against the assessment, repository boundaries, automated tests, security checks, and production behavior before acceptance.

## Tools, model, contribution, and ownership

- **Agent and model:** OpenAI Codex using a GPT-5 model provided by the Codex environment.
- **Tools:** Codex file editing and shell tools, Git, npm scripts, Node.js tests, TypeScript, ESLint, npm audit, PDF/CSV inspection, and local browser automation with Chrome.
- **AI contribution:** The agent produced most of the initial application code, automated tests, and project documentation in response to the prompts below. It also proposed refactors and performed repeatable verification commands.
- **Human contribution:** I defined the requirements and acceptance criteria, selected the architecture, reviewed formulas and dependency boundaries, rejected or revised incorrect output, and decided which changes to retain.
- **Ownership:** I take responsibility for all submitted code and documentation and can explain, test, and modify the implementation during review.

## 1. Requirement analysis and benchmark definition

**Category:** Requirement analysis

**Goal and context:** Understand the five-page assessment and supplied CSV datasets, identify the required product scope, and establish known numeric results before implementation.

**Prompt:**

> Phân tích yêu cầu này và liệt kê các bước để hoàn thành.

The context included `assessment.pdf`, `trades.csv`, and `prices.csv`.

**Agent response:** The agent decomposed the work into data validation, a weighted-average calculation engine, an API boundary, dashboard, charts, transaction explorer, import workflow, testing, and production QA. It also calculated expected sample totals before implementation.

**My review:** I checked the proposed scope against the assessment. Authentication, a database, blockchain integrations, and live price fetching were excluded because they were not required. Tests were moved ahead of UI work so the financial baseline existed first.

**Outcome:** Accepted as the implementation sequence. The sample expectations were later encoded in `portfolio.benchmark.test.js`, including 200 transactions, portfolio totals, per-asset quantities, and allocation reconciliation.

## 2. Project structure and Git workflow

**Category:** Architecture decision

**Goal and context:** Initialize maintainable backend and frontend applications using useful conventions from the Bot Farm references while keeping unrelated business logic and secrets out of the assessment repository.

**Prompt:**

> Khởi tạo dự án với cấu trúc thư mục tương tự bot-farm BE và FE. Mỗi chức năng hoặc issue phải dùng branch riêng.

**Agent response:** The agent scaffolded separate Express and Next.js applications and mirrored the useful route/controller/service and feature-component organization of the reference projects.

**My review:** I verified that reference business logic and secrets were not copied. The team conventions were recorded in `CONTRIBUTING.md`: English lowercase branch names, hyphen-separated descriptions, and conventional commit prefixes. Work proceeded on `feature/*`, `fix/*`, `refactor/*`, or `docs/*` branches rather than directly on `main` or `develop`.

**Outcome:** Accepted. The repository remains a lightweight two-application monorepo without an unnecessary workspace framework.

## 3. Calculator boundary was rejected and refactored

**Category:** Architecture correction — AI result rejected

**Goal and context:** Keep financial rules deterministic and framework-independent so they can be tested without HTTP, UI, or storage dependencies.

**Prompt:**

> Viết calculation engine tách thành module thuần, không phụ thuộc UI hay database.

**Agent response:** The first generated calculator was placed under `src/modules/portfolio` and raised the shared HTTP/application `AppError`. Although it had no UI or database dependency, its location and error type still coupled financial rules to the application layer.

**My review:** I rejected this result because it did not satisfy the requested pure domain boundary. The calculation code needed to accept plain data, return plain data, and report domain errors without knowing about Express or HTTP status codes.

**Correction:** Commit `2795a9e` moved the calculator from `src/modules/portfolio/portfolio.calculator.js` to `src/domain/portfolio/portfolio.calculator.js` and introduced `PortfolioCalculationError`. `portfolio.store.js` now translates domain errors to application `AppError` instances at the boundary.

**Outcome:** Accepted after refactoring. The domain engine depends only on `decimal.js` and its own error type; routes, controllers, storage, and frontend code remain outside it.

## 4. PostCSS dependency recommendation was rejected

**Category:** Dependency/security review — AI result rejected

**Goal and context:** Verify that frontend build dependencies were maintained and that generated version recommendations did not introduce a known vulnerable or obsolete package release.

**Prompt:**

> Kiểm tra dependency và production build trước khi hoàn tất.

**Agent response:** An AI-generated dependency recommendation suggested pinning an older PostCSS release. The proposal presented the version change as a suitable compatibility fix.

**My review:** I rejected the suggested version after dependency review identified it as outdated and potentially exposed to known PostCSS security issues. I inspected the installed dependency graph and lockfile instead of relying on the generated recommendation. The frontend declares `postcss` as `^8.5.3`; the current lock resolves the direct dependency to `8.5.28`, while Next.js carries its own compatible nested release.

**Correction:** The maintained 8.5.x dependency line was retained, dependencies were resolved through the lockfile, and frontend lint, type checking, and the production build were rerun.

**Outcome:** Accepted only after local dependency resolution and build verification. This example is why version or vulnerability claims from AI must be verified against the actual manifest, lockfile, and package audit rather than copied directly.

## 5. Weighted-average engine, validation, and atomic import

**Category:** Implementation

**Goal and context:** Implement all financial rules and CSV validations behind an atomic import boundary, using the supplied prices as the only valuation source.

**Prompt:**

> Triển khai calculation engine weighted-average và bộ validation CSV đầy đủ. BUY fee vào cost basis, SELL fee trừ proceeds, cấm short position, và import lỗi không được thay dataset cũ.

**Agent response:** The agent implemented Decimal-based BUY/SELL processing, deterministic timestamp/trade-ID ordering, structured CSV errors, duplicate detection, required-column validation, supported value checks, price validation, and an in-memory store.

**My review:** I reviewed the implementation for fee handling and mutation order. I required the store to parse and calculate a candidate snapshot before assigning `currentTrades` or `snapshot`; this guarantees that parse, validation, missing-price, or short-position errors cannot replace the last valid dataset.

**Outcome:** Accepted. BUY fees are capitalized, SELL fees reduce net proceeds, full closes clear residual open basis, reopening is supported, and invalid imports are atomic.

## 6. Tests-first calculation and reconciliation debugging

**Category:** Testing and debugging — AI test corrected

**Goal and context:** Establish automated numeric evidence before UI development and expose the entire suite through one documented root command.

**Prompt:**

> Viết test trước khi làm UI và cho phép chạy toàn bộ test bằng một command.

**Agent response:** The agent generated tests for multiple BUY prices, BUY and SELL fees, partial and full closes, reopening, short rejection, duplicate/invalid rows, the full sample benchmark, reversed CSV order, missing prices, failed-import preservation, and allocation totals.

**My review:** I found that one generated reconciliation assertion compared long raw Decimal strings as if separately accumulated values must serialize identically. The calculation context can produce equivalent display currency totals with different insignificant tails depending on division history, so that test overstated the UI contract.

**Correction:** Financial behavior and exact invariants remain exact where required, while dashboard reconciliation compares currency at its documented two-decimal display precision using Decimal `ROUND_HALF_UP`. Allocation is still checked to 20 decimal places and equals `1.00000000000000000000` for the sample.

**Outcome:** Accepted after the assertion was corrected to test the intended contract. `npm test` runs the entire backend suite from the repository root.

## 7. API, dashboard, charts, and transaction explorer

**Category:** Implementation and boundary review

**Goal and context:** Build the required API and product surfaces without duplicating financial calculation logic in React components.

**Prompt:**

> Xây API/backend boundary, dashboard, biểu đồ và transaction explorer. Frontend không được tự tính số liệu tài chính; filter chỉ thay đổi bảng transaction.

**Agent response:** The agent added `GET /api/portfolio`, `POST /api/import`, and `POST /api/reset`, then built six summary cards, holdings, allocation and P&L charts, and the filterable transaction table over the typed snapshot.

**My review:** I inspected the frontend client and components for duplicated cost-basis or P&L formulas. Chart number conversions were permitted only for SVG geometry and presentation. Transaction filter state was kept inside the explorer and never sent back to the portfolio calculator.

**Outcome:** Accepted. Headline values, holdings, and charts share one backend snapshot. Search, exchange/side/date filters, timestamp sorting, and pagination affect only visible transaction rows.

## 8. Import, accessibility, and production QA

**Category:** Testing and debugging

**Goal and context:** Make dataset replacement understandable and recoverable, then verify the completed UI against keyboard, semantic, contrast, responsive, console, and production-build expectations.

**Prompt:**

> Hoàn thiện import UI, accessibility và production QA. Giữ dashboard cũ nếu import lỗi; kiểm tra keyboard, labels, table semantics, contrast, mobile overflow, console và build.

**Agent response:** The agent added drag-and-drop/file selection, file metadata, structured row errors, success/reset feedback, and live-region states, then exercised the production UI at desktop and mobile sizes.

**My review:** I used QA results to identify issues that a source-only review had missed, including a failed favicon request and text contrast near the threshold. Those results were not waived: the icon asset and color tokens were corrected, loading/error announcements were verified in the accessibility tree, and the browser console and production build were checked again.

**Outcome:** Accepted after correction. Invalid CSV upload leaves all six current dashboard metrics unchanged; valid upload replaces the snapshot; reset restores the 200-row sample. Final keyboard, semantic table, contrast, overflow, live-region, console, and build evidence is recorded in `ACCESSIBILITY_QA.md`.

## Review principles used throughout

- AI output is never accepted solely because it compiles or looks plausible.
- Financial formulas are checked against hand-derived examples and fixed sample benchmarks.
- Architectural requirements are verified from dependency direction, not only filenames.
- Dependency advice is checked against the installed graph, lockfile, security tooling, and a clean build.
- A failing or overly strict generated test is corrected to the product contract; production code is not distorted merely to satisfy a flawed assertion.
- Browser and accessibility findings must be reproduced and rechecked after a fix.
