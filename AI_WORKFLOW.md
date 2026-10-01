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

