const fs = require('fs');
let code = fs.readFileSync('apps/web/src/components/shell/notification-modal.tsx', 'utf8');

code = code.replace(
  "import { formatMoney } from '@/lib/formatters';",
  "import { useCurrentUserQuery } from '@/lib/auth/client';\nimport { formatMoney as baseFormatMoney } from '@/lib/formatters';",
);

// We need to inject user currency into HeaderNotificationModal
code = code.replace(
  'export const HeaderNotificationModal = () => {',
  "export const HeaderNotificationModal = () => {\n  const { data: user } = useCurrentUserQuery();\n  const formatMoney = (amount) => baseFormatMoney(amount, user?.currency ?? 'USD');",
);

// Replace the buildBudgetNotifications call inside HeaderNotificationModal
code = code.replace(
  'buildBudgetNotifications(analyticsQuery.data?.budgetSummary.items ?? [], categoryNames)',
  'buildBudgetNotifications(analyticsQuery.data?.budgetSummary.items ?? [], categoryNames, formatMoney)',
);
code = code.replace(
  'buildRecurringNotifications(expensesQuery.data ?? [])',
  'buildRecurringNotifications(expensesQuery.data ?? [], formatMoney)',
);
code = code.replace(
  'buildForecastNotifications(analyticsQuery.data)',
  'buildForecastNotifications(analyticsQuery.data, formatMoney)',
);
code = code.replace(
  'buildGoalNotifications(goalsQuery.data ?? [])',
  'buildGoalNotifications(goalsQuery.data ?? [], formatMoney)',
);
code = code.replace(
  'buildTransactionNotifications(expensesQuery.data ?? [], categoryNames)',
  'buildTransactionNotifications(expensesQuery.data ?? [], categoryNames, formatMoney)',
);

// Now update the signatures of the builders
code = code.replace(
  'const buildBudgetNotifications = (\n  items: DashboardBudgetSummaryItem[],\n  categoryNames: Map<string, string>,\n) =>\n  items',
  'const buildBudgetNotifications = (\n  items: DashboardBudgetSummaryItem[],\n  categoryNames: Map<string, string>,\n  formatMoney: (amount: number) => string\n) =>\n  items',
);

code = code.replace(
  'const buildRecurringNotifications = (expenses: Expense[]) =>',
  'const buildRecurringNotifications = (expenses: Expense[], formatMoney: (amount: number) => string) =>',
);

code = code.replace(
  'const buildForecastNotifications = (analytics?: DashboardAnalytics) => {',
  'const buildForecastNotifications = (analytics: DashboardAnalytics | undefined, formatMoney: (amount: number) => string) => {',
);

code = code.replace(
  'const buildGoalNotifications = (goals: Goal[]) =>',
  'const buildGoalNotifications = (goals: Goal[], formatMoney: (amount: number) => string) =>',
);

code = code.replace(
  'const buildTransactionNotifications = (expenses: Expense[], categoryNames: Map<string, string>) =>',
  'const buildTransactionNotifications = (expenses: Expense[], categoryNames: Map<string, string>, formatMoney: (amount: number) => string) =>',
);

fs.writeFileSync('apps/web/src/components/shell/notification-modal.tsx', code);
