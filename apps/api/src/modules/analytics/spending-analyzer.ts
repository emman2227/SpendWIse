import type {
  Alert,
  AlertSeverity,
  AlertType,
  Budget,
  Category,
  Expense,
  Goal,
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
  static analyze(
    expenses: Expense[],
    budgets: Budget[],
    categories: Category[],
    goals: Goal[] = [],
  ): StructuredFact[] {
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
    facts.push(...this.detectGoalOpportunities(currentExpenses, categories, goals));

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

  static detectGoalOpportunities(
    currentExpenses: Expense[],
    categories: Category[],
    goals: Goal[] = [],
  ): StructuredFact[] {
    const facts: StructuredFact[] = [];
    const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount);

    if (activeGoals.length === 0) return facts;

    // Find top spending categories in current period
    const spendByCategory = new Map<string, number>();
    for (const e of currentExpenses) {
      spendByCategory.set(e.categoryId, (spendByCategory.get(e.categoryId) || 0) + e.amount);
    }

    const sortedCategorySpend = Array.from(spendByCategory.entries())
      .map(([categoryId, amount]) => ({
        category: categories.find((c) => c.id === categoryId),
        amount,
      }))
      .filter((entry) => entry.category && entry.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    for (const goal of activeGoals.slice(0, 2)) {
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const targetDate = new Date(goal.targetDate);
      const now = new Date();
      const monthDiff = Math.max(
        1,
        (targetDate.getUTCFullYear() - now.getUTCFullYear()) * 12 +
          (targetDate.getUTCMonth() - now.getUTCMonth()),
      );
      const monthlyNeeded = remaining / monthDiff;

      const topCategory = sortedCategorySpend[0];
      if (topCategory && topCategory.amount > 0) {
        facts.push({
          type: 'recommendation',
          severity: 'info',
          category: topCategory.category?.name,
          title: `Savings boost for ${goal.title}`,
          message: `Trimming discretionary spend in ${topCategory.category?.name} can help fund ${goal.title} on target.`,
          evidence: {
            currentSpend: topCategory.amount,
            targetAmount: goal.targetAmount,
            currentProgress: goal.currentAmount,
            monthlySavingsNeeded: Math.round(monthlyNeeded),
          },
        });
      } else {
        facts.push({
          type: 'recommendation',
          severity: 'info',
          title: `Goal pace: ${goal.title}`,
          message: `Set aside about ${monthlyNeeded.toFixed(0)}/month over the next ${monthDiff} month(s) to hit your target on schedule.`,
          evidence: {
            targetAmount: goal.targetAmount,
            currentProgress: goal.currentAmount,
            monthlySavingsNeeded: Math.round(monthlyNeeded),
          },
        });
      }
    }

    return facts;
  }

  static detectAlerts(
    expenses: Expense[],
    budgets: Budget[],
    categories: Category[],
  ): Array<Omit<Alert, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>> {
    const alerts: Array<Omit<Alert, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>> = [];
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // 1. Transaction Spikes and Anomalies
    const categoryExpenses = new Map<string, Expense[]>();
    for (const exp of expenses) {
      if (!categoryExpenses.has(exp.categoryId)) {
        categoryExpenses.set(exp.categoryId, []);
      }
      categoryExpenses.get(exp.categoryId)!.push(exp);
    }

    // Overall mean for fallback comparison
    const allAmounts = expenses.map((e) => e.amount);
    const overallMean =
      allAmounts.length > 0 ? allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length : 0;

    for (const [catId, catExps] of categoryExpenses.entries()) {
      const catName = categoryMap.get(catId) || 'General';
      const amounts = catExps.map((e) => e.amount);
      const catMean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const benchmarkMean = catExps.length >= 2 ? catMean : overallMean;

      for (const exp of catExps) {
        if (benchmarkMean > 0 && exp.amount >= benchmarkMean * 2.2 && exp.amount >= 25) {
          const ratio = (exp.amount / benchmarkMean).toFixed(1);
          const severity: AlertSeverity = exp.amount >= benchmarkMean * 3.5 ? 'danger' : 'warning';
          const type: AlertType = 'spike';

          alerts.push({
            type,
            severity,
            merchant: exp.description,
            category: catName,
            categoryId: exp.categoryId,
            amount: exp.amount,
            date: exp.date,
            transactionId: exp.id,
            reason: `This amount is ${ratio}x higher than your usual ${catName} average (${benchmarkMean.toFixed(0)}).`,
            suggestedAction:
              'Mark as normal if this was a planned one-off purchase, or re-categorize if needed.',
            evidence: {
              currentSpend: exp.amount,
              averageSpend: benchmarkMean,
              ratio: parseFloat(ratio),
              transactionId: exp.id,
            },
          });
        }
      }
    }

    // 2. Near-duplicate charges within 48 hours
    const sortedExpenses = [...expenses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    for (let i = 0; i < sortedExpenses.length; i++) {
      for (let j = i + 1; j < sortedExpenses.length; j++) {
        const expA = sortedExpenses[i];
        const expB = sortedExpenses[j];
        if (!expA || !expB) continue;

        const timeDiff = Math.abs(new Date(expB.date).getTime() - new Date(expA.date).getTime());
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

        if (daysDiff > 2) break; // Array is sorted by date, no need to check further

        const descA = expA.description.trim().toLowerCase();
        const descB = expB.description.trim().toLowerCase();
        const amountRatio = Math.abs(expA.amount - expB.amount) / Math.max(expA.amount, 1);

        if (
          expA.id !== expB.id &&
          (descA === descB || descA.includes(descB) || descB.includes(descA)) &&
          amountRatio <= 0.05
        ) {
          const catName = categoryMap.get(expB.categoryId) || 'General';
          alerts.push({
            type: 'duplicate',
            severity: 'danger',
            merchant: expB.description,
            category: catName,
            categoryId: expB.categoryId,
            amount: expB.amount,
            date: expB.date,
            transactionId: expB.id,
            reason: `A near-duplicate charge of ${expB.amount} was logged within 48 hours of another transaction for "${expA.description}".`,
            suggestedAction:
              'Confirm if this is an unintended double-charge. If suspicious, contact the merchant or your bank.',
            evidence: {
              firstTransactionId: expA.id,
              secondTransactionId: expB.id,
              firstDate: expA.date,
              secondDate: expB.date,
              amount: expB.amount,
            },
          });
        }
      }
    }

    // 3. Category Budget Overspending Alerts
    const currentMonth = new Date().getUTCMonth();
    const currentYear = new Date().getUTCFullYear();
    const currentMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
    });

    const spendByCat = new Map<string, number>();
    for (const exp of currentMonthExpenses) {
      spendByCat.set(exp.categoryId, (spendByCat.get(exp.categoryId) || 0) + exp.amount);
    }

    for (const budget of budgets) {
      const spent = spendByCat.get(budget.categoryId) || 0;
      const catName = categoryMap.get(budget.categoryId) || 'Budget Category';

      if (budget.limitAmount > 0 && spent >= budget.limitAmount * 0.9) {
        const isOver = spent > budget.limitAmount;
        const overAmount = spent - budget.limitAmount;
        const utilization = Math.round((spent / budget.limitAmount) * 100);

        alerts.push({
          type: 'budget_risk',
          severity: isOver ? 'danger' : 'warning',
          merchant: `${catName} Budget Limit`,
          category: catName,
          categoryId: budget.categoryId,
          amount: isOver ? overAmount : spent,
          date: new Date().toISOString(),
          reason: isOver
            ? `${catName} budget has been exceeded by ${overAmount.toFixed(2)} (${utilization}% of limit).`
            : `${catName} has reached ${utilization}% of its monthly spending limit.`,
          suggestedAction: isOver
            ? `Pause discretionary purchases in ${catName} or adjust your budget limit.`
            : `Track remaining transactions closely to stay within the ${budget.limitAmount} limit.`,
          evidence: {
            spent,
            limit: budget.limitAmount,
            utilization,
            overAmount: isOver ? overAmount : 0,
          },
        });
      }
    }

    // Deduplicate alerts by unique signature (type + merchant/transactionId + date)
    const seen = new Set<string>();
    const deduplicatedAlerts: Array<
      Omit<Alert, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>
    > = [];

    for (const a of alerts) {
      const key = `${a.type}:${a.transactionId || a.categoryId || a.merchant}:${a.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicatedAlerts.push(a);
      }
    }

    return deduplicatedAlerts;
  }
}
