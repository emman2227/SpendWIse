# SpendWise

SpendWise is a production-minded monorepo starter for an AI Spending Behavior Analyzer. It is scaffolded for web, mobile, API, shared domain code, and an AI analytics layer from the first commit.

## Stack

- `pnpm` workspace + `Turborepo`
- TypeScript across the repository
- `Next.js` for web
- `Expo` + React Native for mobile
- `NestJS` for the backend API
- `MongoDB` + `Mongoose`
- `JWT` access and refresh tokens
- `Zod` for shared validation
- `TanStack Query` for server-state patterns in presentation apps
- `Zustand` for lightweight client session state
- `ESLint` + `Prettier` + `Husky` + `lint-staged`

## Why NestJS Instead Of Express

NestJS was chosen because SpendWise needs clear module boundaries, request guards, API versioning, dependency injection, and room to grow into a more structured product. Express would work, but NestJS gives the repository a stronger foundation for clean architecture and feature-based expansion without adding ad hoc structure later.

## Repository Layout

```text
apps/
  api/       NestJS API and application-layer entry point
  mobile/    Expo React Native app
  web/       Next.js app
packages/
  ai/        AI analytics abstraction, provider factory, mock provider
  config/    shared TypeScript, ESLint, and Prettier config
  shared/    reusable types, schemas, constants, helpers
  ui/        lightweight shared UI tokens and starter primitives
docs/
  architecture.md
  api-notes.md
  roadmap.md
```

## Quick Start

### 1. Install

```bash
pnpm install
```

### 2. Configure environment files

Copy and fill these examples as needed:

- `.env.example`

If you want email verification to send through Gmail SMTP, also set these in your root `.env`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM_EMAIL=yourgmail@gmail.com
SMTP_FROM_NAME=SpendWise
```

Google SMTP requires a Gmail or Google Workspace account with 2-Step Verification enabled plus an App Password. If SMTP is not configured yet, SpendWise falls back to logging the verification code in the API terminal during local development.

### 3. Run the apps

```bash
pnpm dev
```

Or run them individually:

```bash
pnpm --filter @spendwise/api dev
pnpm --filter @spendwise/web dev
pnpm --filter @spendwise/mobile dev
```

## Useful Scripts

```bash
pnpm build
pnpm lint
pnpm test
pnpm --filter @spendwise/api seed
```

## What Is Included

- Auth starter: register, login, logout, refresh token flow, protected profile route
- Expense starter: create, update, delete, list
- Budget starter: category budgets and monthly summary
- Dashboard starter: totals, breakdowns, trends, recent transactions
- AI starter: provider abstraction, mock insights, anomaly detection, forecasting interface
- Health check endpoint: `GET /api/health`
- API versioning strategy: `/api/v1/...`
- Shared domain models and Zod schemas
- Seed-ready category structure
- Starter tests in shared, AI, and API layers

## API Notes

Important starter routes:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification-code`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `GET /api/v1/expenses`
- `POST /api/v1/expenses`
- `PATCH /api/v1/expenses/:expenseId`
- `DELETE /api/v1/expenses/:expenseId`
- `GET /api/v1/budgets`
- `POST /api/v1/budgets`
- `GET /api/v1/budgets/summary`
- `GET /api/v1/analytics/dashboard`
- `POST /api/v1/analytics/generate`

More detail is in [`docs/api-notes.md`](./docs/api-notes.md).

## Architecture Snapshot

SpendWise uses a modular 3-tier architecture with an added AI analytics layer:

1. Presentation layer: `apps/web` and `apps/mobile`
2. Application layer: `apps/api`
3. Data layer: Mongoose schemas, repositories, and seed structure inside `apps/api`
4. AI analytics layer: `packages/ai`

See [`docs/architecture.md`](./docs/architecture.md) for the fuller breakdown.

## Notes

- The AI package currently ships with a mock provider and clean extension points for Gemini or other LLM providers later.
- The web app includes a protected-route middleware pattern on `/profile`.
- The dashboard UIs currently use starter data so product work can begin before the full backend wiring is complete.
- TODO markers are included where real AI provider integration and richer auth UX should plug in next.
