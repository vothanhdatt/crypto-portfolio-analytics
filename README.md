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

## Status

The project skeleton, health endpoint, shared response contract, frontend shell, and initial documentation are in place. Portfolio calculation and CSV import are the next implementation milestones.
