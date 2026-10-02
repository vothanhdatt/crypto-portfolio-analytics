# AI-Assisted Development Workflow

This document explains how I used AI as a development assistant during the assessment. Before asking AI to do any work, I read the assessment and reviewed the supplied CSV files myself. I first formed my own understanding of the expected behavior, scope, and acceptance criteria. I then used AI to cross-check that understanding, clarify uncertain points, and identify edge cases I might have missed.

Implementation was divided into small, reviewable stages. After each stage, I inspected the generated code, compared it with the assessment, ran the relevant tests or build checks, and requested corrections when the result did not meet the intended design. I did not ask AI to generate the entire application in one step, and I did not treat generated output as correct without verification.

## Tools, contribution, and ownership

- **AI assistant:** OpenAI Codex with a GPT-5 model provided by the Codex environment.
- **Supporting tools:** Git, npm scripts, Node.js tests, TypeScript, ESLint, npm audit, PDF/CSV inspection, and browser-based UI checks.
- **My contribution:** I read and interpreted the assessment, defined the implementation order and acceptance criteria, selected the final architecture, reviewed the financial formulas, checked generated code and tests, rejected unsuitable results, and decided which changes to keep.
- **AI contribution:** AI helped analyze my interpretation of the requirements, propose implementation details, generate code and tests for individual stages, investigate failures, and update documentation.
- **Ownership:** I take responsibility for all submitted code and documentation. I can explain, test, debug, and modify the implementation without relying on the AI conversation history.

## Working method

For each part of the assessment, I followed this cycle:

1. Read the relevant requirement and determine the expected result myself.
2. Ask AI to restate or analyze it so I could compare its interpretation with mine.
3. Clarify assumptions and reject anything outside the assessment scope.
4. Ask AI to implement one bounded stage.
5. Review the files and logic produced in that stage.
6. Run targeted tests, linting, type checks, builds, or browser checks.
7. Fix or reject the output before moving to the next stage.

The following examples show how this process was applied.

## 1. Cross-checking my understanding of the assessment

**Category:** Requirement analysis

**My understanding before using AI:** After reading the assessment and inspecting `trades.csv` and `prices.csv`, I understood that the required product was a portfolio analytics application based on weighted-average cost basis. It needed a backend calculation boundary, CSV import and validation, a dashboard, charts, a transaction explorer, automated tests, documentation, and a deployed application. I also understood that authentication, a database, blockchain integration, and live market-price fetching were not required.

**What I asked AI:**

> Tôi đã đọc và nắm các yêu cầu chính của đề bài cùng các file dữ liệu được cung cấp. Hãy phân tích lại yêu cầu, liệt kê các đầu việc, các trường hợp biên và đề xuất thứ tự triển khai để tôi đối chiếu với cách hiểu của mình. Đồng thời làm rõ những điểm còn có thể gây nhầm lẫn.

**AI response:** AI grouped the work into CSV validation, weighted-average calculation, API endpoints, dashboard, charts, transaction explorer, import/reset behavior, testing, accessibility, documentation, and deployment. It also highlighted ambiguous points such as fee treatment, transaction ordering, short positions, missing prices, and failed-import behavior.

**My verification and decision:** I compared every proposed item with the PDF and removed ideas that were not part of the assessment. I decided that the calculation engine and its tests had to be completed before UI work. I also required benchmark values from the supplied dataset so later API and UI results could be reconciled.

**Outcome:** The analysis was accepted only as a cross-check of my original reading. It became the implementation checklist, with financial logic and tests scheduled first.

## 2. Defining the project structure and Git workflow

**Category:** Architecture decision

**My understanding before using AI:** I wanted separate backend and frontend applications, similar in organization to the Bot Farm projects, while avoiding copied business logic or unnecessary infrastructure. I also wanted each feature or issue developed on its own branch instead of directly on `main` or `dev`.

**What I asked AI:**

> Tiến hành khởi tạo dự án backend và frontend với cấu trúc thư mục tương tự dự án Bot Farm BE và FE. Mỗi chức năng hoặc issue phải được thực hiện trên một branch riêng. Bổ sung tài liệu về quy tắc đặt tên branch và commit.

**AI response:** AI proposed an Express backend organized by route, controller, service, middleware, and domain responsibilities, plus a Next.js frontend organized by application and feature components. It also drafted the Git conventions.

**My verification and decision:** I reviewed the generated folders and dependencies before accepting them. I confirmed that no secrets or unrelated Bot Farm code had been copied. I kept the two-application repository because it was sufficient for the assessment and rejected adding an unnecessary monorepo framework.

**Outcome:** The initial structure and Git rules were accepted. The conventions are recorded in `CONTRIBUTING.md`, and later work was split across `feature/*`, `fix/*`, `refactor/*`, and `docs/*` branches.

## 3. Rejecting the first calculator boundary

**Category:** Architecture correction — AI result rejected

**My understanding before using AI:** The calculator had to be a pure domain module. It should receive plain trade and price data, return calculated results, and remain independent from Express, HTTP errors, UI code, and database/storage code.

**What I asked AI:**

> Viết calculation engine theo phương pháp weighted-average thành một domain module thuần, không phụ thuộc vào UI, database, Express hoặc HTTP error.

**AI response:** The first version was placed under `src/modules/portfolio` and threw the application's shared `AppError`. The calculations worked, but the domain rules still depended on an application/HTTP-oriented error type.

**My verification and decision:** I inspected the imports rather than judging purity from the filename alone. Because the calculator depended on `AppError`, it did not satisfy the domain boundary I had defined. I rejected that structure and asked AI to move the logic into a dedicated domain module with its own domain error.

**Correction:** The calculator was moved to `src/domain/portfolio/portfolio.calculator.js` and now uses `PortfolioCalculationError`. The store/application layer translates domain failures into API-facing `AppError` instances.

**Outcome:** I accepted the revised version only after confirming that the domain calculator depended on `decimal.js` and its own domain code, not on routes, controllers, storage, or frontend modules.

## 4. Implementing and checking the financial rules

**Category:** Incremental implementation

**My understanding before using AI:** From the assessment, I determined that BUY fees must increase cost basis, SELL fees must reduce proceeds, partial sales must use the weighted-average unit cost immediately before the sale, full closes must clear the remaining basis, and any sale greater than the available quantity must be rejected.

**What I asked AI:**

> Triển khai calculation engine weighted-average và bộ validation CSV đầy đủ. Cần xử lý nhiều lệnh BUY với giá khác nhau, BUY fee được đưa vào cost basis, partial SELL, SELL fee được trừ khỏi proceeds, full close rồi BUY lại, từ chối short position, duplicate hoặc invalid CSV row và missing price.

**AI response:** AI implemented Decimal-based processing, deterministic ordering by timestamp and trade ID, CSV schema/value validation, duplicate detection, missing-price checks, and structured validation errors.

**My verification and decision:** I manually reviewed the BUY and SELL equations and followed representative trades through the code. I checked that a failed calculation occurred before the current snapshot was replaced. I also verified that a fully closed position did not retain an insignificant residual cost basis.

**Outcome:** The implementation was accepted after the formulas and mutation order matched my expected behavior. Invalid imports do not replace the last valid dataset.

## 5. Writing tests before building the UI

**Category:** Testing and debugging

**My understanding before using AI:** The financial engine was the highest-risk part of the assessment, so its behavior needed executable evidence before any dashboard components were built. One root command also needed to run the complete automated suite.

**What I asked AI:**

> Viết test trước khi làm UI. Các test cần bao phủ nhiều BUY với mức giá khác nhau, BUY/SELL fee, partial và full close, BUY lại sau khi đóng vị thế, từ chối short position, duplicate hoặc invalid CSV row, benchmark của toàn bộ sample dataset, CSV đảo thứ tự, missing price, import thất bại không thay dataset cũ và tổng allocation xấp xỉ 100%. Cần có một command duy nhất để chạy toàn bộ test.

**AI response:** AI generated unit, validation, import, and benchmark tests and exposed them through the root `npm test` command.

**My verification and decision:** I reviewed each test to ensure it asserted business behavior instead of merely reproducing the implementation. I ran the full sample dataset and compared portfolio totals, asset quantities, transaction count, and allocation reconciliation. I also tested reversed input ordering to confirm deterministic results.

**Correction:** One generated test compared long raw Decimal strings even though the UI contract displays currency to two decimal places. I rejected that assertion because harmless division tails could make equivalent display totals serialize differently. I changed the reconciliation check to use the documented `ROUND_HALF_UP` currency precision while keeping exact checks where exactness was required.

**Outcome:** UI development started only after the engine and validation suite passed. The complete backend suite can be run with one command: `npm test` from the repository root.

## 6. Building the API before connecting the frontend

**Category:** Boundary implementation

**My understanding before using AI:** The frontend should display already-calculated, validated data. It should not recalculate cost basis, realized P&L, unrealized P&L, or portfolio totals. The backend therefore needed to own sample loading, parsing, validation, calculation, import, and reset behavior.

**What I asked AI:**

> Xây API/backend boundary gồm `GET /api/portfolio`, `POST /api/import` và `POST /api/reset`. Backend chịu trách nhiệm đọc sample data, parse và validate file import, chạy calculation engine và trả về kết quả typed. Không để frontend tự tính số liệu tài chính.

**AI response:** AI added the API routes and a typed frontend client, then connected the dashboard to a single backend snapshot.

**My verification and decision:** I inspected frontend code for duplicated financial formulas. Converting numeric strings to numbers for chart geometry was acceptable, but recomputing portfolio figures in React was not. I also verified the API success and error shapes and checked that import/reset returned complete recalculated snapshots.

**Outcome:** The boundary was accepted. Summary cards, holdings, charts, and transactions consume the same backend result, so the displayed metrics can be reconciled.

## 7. Adding UI features one stage at a time

**Category:** Incremental UI implementation

**My understanding before using AI:** I divided the UI into four separate stages: dashboard summary and holdings, charts, transaction explorer, and import/reset. Transaction filters had to affect only the table and never the portfolio calculation.

**What I asked AI:**

> Triển khai UI theo từng bước. Trước tiên làm sáu summary cards và holdings table. Sau khi kiểm tra xong thì thêm biểu đồ allocation và P&L. Tiếp theo xây transaction explorer với filter, sorting và pagination. Cuối cùng hoàn thiện CSV import, validation errors theo dòng, success message và reset về sample data.

**AI response:** AI implemented each stage in sequence, including timestamp display, loading/error/empty states, responsive tables, accessible P&L labels, mobile-friendly chart legends/tooltips, transaction filters, drag-and-drop upload, and reset feedback.

**My verification and decision:** After each stage, I compared the visible values with the API snapshot and the sample benchmark. I tested positive and negative P&L, zero allocations, mobile overflow, filtering, sorting, pagination, valid imports, invalid imports, and reset. I specifically confirmed that changing transaction filters did not issue a new portfolio calculation or change summary metrics.

**Outcome:** Each UI stage was retained only after it worked against the existing backend contract. A failed import leaves the current dashboard unchanged, while a successful import replaces the visible snapshot.

## 8. Rejecting unsafe dependency advice and completing QA

**Category:** Production QA — AI result rejected

**My understanding before using AI:** Before submission, the project needed accessible interaction, no browser console errors, passing lint/type/tests, a successful production build, and dependencies checked against the actual lockfile. Version recommendations from AI were not sufficient evidence.

**What I asked AI:**

> Kiểm tra lại accessibility, runtime behavior, dependencies, toàn bộ test và production build. Hãy báo cáo các lỗi tìm thấy, nhưng không được kết luận một phiên bản package là an toàn nếu chưa kiểm tra dependency graph, manifest, lockfile và audit result thực tế.

**AI response:** AI helped identify UI issues such as a missing favicon and borderline text contrast. It also initially suggested pinning an older PostCSS version as a compatibility fix.

**My verification and decision:** I verified browser findings at desktop and mobile sizes and inspected keyboard navigation, labels, semantic tables, live regions, overflow, and console output. I rejected the PostCSS suggestion after checking the manifest, lockfile, and audit information because the proposed release was outdated and potentially affected by known security issues.

**Correction:** I retained the maintained PostCSS 8.5.x line, used the resolved lockfile dependency, fixed the favicon and contrast issues, and reran tests, linting, type checking, dependency audit, browser checks, and the production build.

**Outcome:** The final result was accepted only after the checks passed. The detailed accessibility and production QA evidence is recorded in `ACCESSIBILITY_QA.md`.

## Review principles applied throughout

- I established my own interpretation of the requirement before prompting AI.
- I used AI to challenge or clarify that interpretation, not to replace reading the assessment.
- I divided the work into bounded stages and reviewed each stage before requesting the next one.
- I checked financial formulas with small manual examples and fixed sample benchmarks.
- I judged architecture by dependency direction, not only by folder or file names.
- I checked generated tests against the intended product contract.
- I verified dependency advice against the manifest, lockfile, audit results, and a production build.
- I reproduced browser and accessibility issues and reran checks after every correction.
- I rejected or revised AI output whenever it conflicted with the assessment, the architecture, security expectations, or verified application behavior.
