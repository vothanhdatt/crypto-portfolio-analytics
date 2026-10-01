# Crypto Portfolio Dashboard

Next.js App Router frontend organized with application routes, reusable components, a typed API client, and shared domain types.

## Commands

```bash
npm run dev
npm run typecheck
npm run build
```

The local app runs on `http://localhost:3002` and expects the API at `http://localhost:1113` by default.

## Vercel

Create a Vercel Project with this directory as its Root Directory. Next.js is detected automatically.

Production environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://<backend-project>.vercel.app
NEXT_PUBLIC_SITE_URL=https://<frontend-project>.vercel.app
```

Set these public variables before building because Next.js embeds them in the browser bundle.
