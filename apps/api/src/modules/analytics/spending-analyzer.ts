import type {
  Budget,
  Category,
  Expense,
  InsightEvidence,
  InsightSeverity,
  InsightType,
} from '@spendwise/shared';

export interface StructuredFact {
  type: InsightType;
  severity: InsightSeverity;
  category?: string;
  title: string;
  message: string;
  evidence: InsightEvidence;
}

export class SpendingAnalyzer {
  static analyze(expenses: Expense[], budgets: Budget[], categories: Category[]): StructuredFact[] {
    const facts: StructuredFact[] = [];

    // Split into current vs historical based on current month
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    const currentExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
    });

    const historicalExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getUTCMonth() !== currentMonth || d.getUTCFullYear() !== currentYear;
    });

    facts.push(...this.detectAnomalies(currentExpenses, historicalExpenses, categories));
    facts.push(...this.detectBudgetRisks(currentExpenses, budgets, categories));
    facts.push(...this.detectTrends(currentExpenses, historicalExpenses, categories));

    // Fallback if no facts generated
    if (facts.length === 0) {
      facts.push({
        type: 'summary',
        severity: 'info',
        title: 'Routine spending',
        message: 'Your spending patterns look normal with no unusual activity detected.',
        evidence: {},
      });
    }

    return facts;
  }

  static detectAnomalies(
    currentExpenses: Expense[],
    historicalExpenses: Expense[],
    categories: Category[],
  ): StructuredFact[] {
    const facts: StructuredFact[] = [];

    // Group historical by category to find average transaction size
    const historicalByCategory = new Map<string, Expense[]>();
    for (const e of historicalExpenses) {
      if (!historicalByCategory.has(e.categoryId)) historicalByCategory.set(e.categoryId, []);
      historicalByCategory.get(e.categoryId)!.push(e);
    }

    for (const expense of currentExpenses) {
      const hist = historicalByCategory.get(expense.categoryId) || [];
      if (hist.length < 3) continue; // Not enough data to call it an anomaly

      const amounts = hist.map((h) => h.amount);
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;

      // Simple anomaly detection: > 2x the mean
      if (mean > 0 && expense.amount > mean * 2) {
        const category = categories.find((c) => c.id === expense.categoryId);
        facts.push({
          type: 'anomaly',
          severity: 'warning',
          category: category?.name,
          title: 'Unusually large transaction',
          message: `${expense.description} is significantly larger than your typical transaction in this category.`,
          evidence: {
            currentSpend: expense.amount,
            averageSpend: mean,
            percentChange: Math.round(((expense.amount - mean) / mean) * 100),
          },
        });
      }
    }

    return facts;
  }

  static detectBudgetRisks(
    currentExpenses: Expense[],
    budgets: Budget[],
    categories: Category[],
  ): StructuredFact[] {
    const facts: StructuredFact[] = [];

    // Calculate current spend by category
    const spendByCategory = new Map<string, number>();
    for (const e of currentExpenses) {
      spendByCategory.set(e.categoryId, (spendByCategory.get(e.categoryId) || 0) + e.amount);
    }

    for (const budget of budgets) {
      const spent = spendByCategory.get(budget.categoryId) || 0;
      const utilization = (spent / budget.limitAmount) * 100;
      const category = categories.find((c) => c.id === budget.categoryId);

      if (utilization >= 90) {
        facts.push({
          type: 'budget',
          severity: utilization > 100 ? 'critical' : 'warning',
          category: category?.name,
          title: utilization > 100 ? 'Budget exceeded' : 'Approaching budget limit',
          message:
            utilization > 100
              ? `You have exceeded your ${category?.name} budget by ${(spent - budget.limitAmount).toFixed(2)}.`
              : `You are very close to your ${category?.name} budget limit.`,
          evidence: {
            currentSpend: spent,
            budget: budget.limitAmount,
            budgetUtilization: Math.round(utilization),
          },
        });
      }
    }

    return facts;
  }

  static detectTrends(
    currentExpenses: Expense[],
    historicalExpenses: Expense[],
    categories: Category[],
  ): StructuredFact[] {
    const facts: StructuredFact[] = [];

    const currentSpendByCategory = new Map<string, number>();
    for (const e of currentExpenses) {
      currentSpendByCategory.set(
        e.categoryId,
        (currentSpendByCategory.get(e.categoryId) || 0) + e.amount,
      );
    }

    // Average monthly spend from history (last 3 months)
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setUTCMonth(now.getUTCMonth() - 3);

    const recentHist = historicalExpenses.filter((e) => new Date(e.date) >= threeMonthsAgo);

    const histSpendByCategory = new Map<string, number>();
    for (const e of recentHist) {
      histSpendByCategory.set(
        e.categoryId,
        (histSpendByCategory.get(e.categoryId) || 0) + e.amount,
      );
    }

    // Since it's 3 months, divide by 3
    const avgSpendByCategory = new Map<string, number>();
    for (const [cat, total] of histSpendByCategory.entries()) {
      avgSpendByCategory.set(cat, total / 3);
    }

    for (const [cat, current] of currentSpendByCategory.entries()) {
      const avg = avgSpendByCategory.get(cat) || 0;
      if (avg === 0) continue;

      const category = categories.find((c) => c.id === cat);
      const percentChange = ((current - avg) / avg) * 100;

      if (percentChange > 25) {
        facts.push({
          type: 'trend',
          severity: 'warning',
          category: category?.name,
          title: 'Spending is trending up',
          message: `Your spending in ${category?.name} is higher than your recent monthly average.`,
          evidence: {
            currentSpend: current,
            averageSpend: avg,
            percentChange: Math.round(percentChange),
            comparisonPeriod: 'last 3 months',
          },
        });
      } else if (percentChange < -25 && current > 0) {
        facts.push({
          type: 'positive',
          severity: 'positive',
          category: category?.name,
          title: 'Spending is trending down',
          message: `Your spending in ${category?.name} is noticeably lower than your recent monthly average.`,
          evidence: {
            currentSpend: current,
            averageSpend: avg,
            percentChange: Math.round(percentChange),
            comparisonPeriod: 'last 3 months',
          },
        });
      }
    }

    return facts;
  }
}
