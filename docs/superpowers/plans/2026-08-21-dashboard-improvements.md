# Dashboard Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the SpendWise dashboard by introducing card pagination, fixing the AI forecast overflow with an expandable "View more" toggle, reducing excessive white spaces, and replacing raw JSON evidence system text with user-friendly formatting.

**Architecture:** Frontend UI enhancement in Next.js/React (`apps/web`). Introduce a reusable `Pagination` UI component, add formatting utility for insight evidence, and update `apps/web/src/app/(workspace)/dashboard/page.tsx` to handle stateful pagination, toggleable forecast details, and compact whitespace styling.

**Tech Stack:** Next.js 15, React 18, Tailwind CSS, Lucide Icons, TypeScript.

---

### Task 1: Create reusable Pagination component

**Files:**

- Create: `apps/web/src/components/ui/pagination.tsx`

- [ ] **Step 1: Write the component with props and styling**
  - Support `currentPage`, `totalPages`, `onPageChange`, `pageSize`, `totalItems`, and `compact` mode.
  - Render Prev/Next buttons with chevron icons and page status ("Page X of Y" or "X-Y of Z").
- [ ] **Step 2: Verify export and type safety**

---

### Task 2: Add insight evidence formatter in formatters.ts

**Files:**

- Modify: `apps/web/src/lib/formatters.ts`

- [ ] **Step 1: Implement `formatInsightEvidence(evidence: InsightEvidence | undefined, currency: string): string | null`**
  - Format `currentSpend`, `averageSpend`, `percentChange`, `comparisonPeriod`, and `budgetUtilization` into human-friendly text.
- [ ] **Step 2: Export and test helper logic**

---

### Task 3: Update Dashboard Page

**Files:**

- Modify: `apps/web/src/app/(workspace)/dashboard/page.tsx`

- [ ] **Step 1: Add pagination state and controls for Budgets, AI Insights, and Recent Transactions**
  - Slices: Budgets (3 per page), AI Insights (2 per page), Recent Transactions (4 per page).
- [ ] **Step 2: Add collapsible 'View more' toggle for AI Forecast confidence explanation**
  - Keep stat boxes uniform in height.
- [ ] **Step 3: Replace raw JSON `Data point:` text with clean formatted evidence**
- [ ] **Step 4: Reduce white spaces and tighten container padding/margins**
- [ ] **Step 5: Verify build and linting**
  - Run `pnpm --filter @spendwise/web lint` and `pnpm --filter @spendwise/web build`.

---

## Verification Plan

### Automated Tests

- `pnpm --filter @spendwise/web lint`
- `pnpm --filter @spendwise/web build`

### Manual Verification

- Verify card pagination on Budgets, Insights, and Transactions.
- Verify AI forecast "View more" toggle behavior and box alignment.
- Verify removed system JSON text in AI insights.
- Verify tight, modern dashboard spacing.
