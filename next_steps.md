# SpendWise: Next Steps & Phased Workload (Web-First)

Based on our updated strategy, we will prioritize building and polishing the Web application and backend API first. The mobile application will be developed in a later phase once the core product is stable.

## Phase 1: Web-API Integration & Authentication

_Goal: Wire up the Next.js web application to the fully functional NestJS API and establish secure authentication._

- [x] **API Connection**: Connect the Web login and dashboard views to live API routes.
- [x] **Session Management**: Implement a consistent client strategy for storing access and refresh tokens securely (e.g., HTTP-only cookies for web).
- [x] **Client State**: Integrate client-side token refresh handling within the Next.js app.
- [x] **Seeding & Mocking**: Add a seeded demo user and sample expenses to test UI features.
- [x] **Core UI Polish**: Implement UI for category editing, expense management, and budget limits in the web app.

## Phase 2: AI Analytics Integration

_Goal: Move beyond the mock provider and build out the actual AI intelligence layer for the web dashboard._

- [x] **Gemini Integration**: Build and integrate a Google Gemini provider adapter in `packages/ai` (implementing `BaseAnalyticsProvider`).
- [x] **Prompt Management**: Establish a system to store and version prompts for analytics outputs.
- [x] **Explainability**: Add metadata to AI insights so users understand _why_ a certain recommendation or anomaly was flagged.
- [x] **Confidence Scoring**: Compare forecast confidence across different strategies and display this on the dashboard.

## Phase 3: Core Web Product Expansion

_Goal: Add high-value features for users now that the core flows and AI are operational._

- [x] **Recurring Expenses**: Support creation and tracking of subscription-like recurring expenses.
- [x] **Budget Recommendations**: Use the AI layer to suggest budget limits based on past spending behavior.
- [x] **Overspending Alerts**: Implement real-time or daily notifications for nearing or exceeding budget limits.
- [x] **Data Export**: Create exportable reports (e.g., CSV, PDF) for users' monthly summaries.
- [x] **Shared Budgets**: Support household or shared budget features (multi-user data access).

## Phase 4: Engineering Hardening & DevOps (Web & API)

_Goal: Prepare the web application and API for production traffic, ensure stability, and streamline deployments._

- [ ] **Integration Testing**: Add comprehensive integration tests for critical paths (Auth, Expense flows).
- [ ] **Observability**: Implement request tracing and structured logging across the NestJS API.
- [ ] **Rate Limiting**: Protect the API (especially auth and AI generation endpoints) with rate limiters.
- [ ] **CI/CD Pipeline**: Set up automated CI pipelines for linting, testing, and building across the monorepo (Web and API).
- [ ] **Deployment Preparation**: Finalize deployment configurations for the Web (e.g., Vercel/Next.js) and API (e.g., Docker/Render).

## Phase 5: Mobile App Development

_Goal: Bring SpendWise to iOS and Android using Expo._

- [ ] **Expo Setup**: Initialize and configure the Expo React Native app.
- [ ] **Shared UI**: Leverage `@spendwise/ui` for cross-platform components where applicable.
- [ ] **Mobile Auth**: Implement secure token storage on mobile devices (e.g., SecureStore).
- [ ] **Feature Parity**: Replicate the core flows (dashboard, expense entry, analytics) in the mobile app.
- [ ] **App Store Deployment**: Prepare EAS configurations for iOS and Android builds.

---

### How to use this document:

Mark tasks with `[x]` as we progress through them. We will focus entirely on **Phases 1 through 4** before starting **Phase 5**.
