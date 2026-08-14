import type {
  Budget,
  Category,
  CategoryForecast,
  Expense,
  ForecastRisk,
  ForecastRiskLevel,
} from '@spendwise/shared';

export interface ForecastData {
  currentSpend: number;
  predictedAmount: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  confidenceExplanation: string;
  categoryForecasts: CategoryForecast[];
  risks: ForecastRisk[];
}

export class ForecastEngine {
  static computeForecast(
    currentExpenses: Expense[],
    historicalExpenses: Expense[],
    budgets: Budget[],
    categories: Category[],
  ): ForecastData {
    // 1. Analyze historical data depth
    const allExpenses = [...historicalExpenses, ...currentExpenses];

    if (allExpenses.length === 0) {
      return this.createInsufficientDataState();
    }

    // Group expenses by month (YYYY-MM)
    const monthlyTotals = new Map<string, number>();
    const monthlyCategoryTotals = new Map<string, Map<string, number>>(); // month -> category -> total

    for (const expense of allExpenses) {
      const date = new Date(expense.date);
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + expense.amount);

      if (!monthlyCategoryTotals.has(monthKey)) {
        monthlyCategoryTotals.set(monthKey, new Map<string, number>());
      }
      const catMap = monthlyCategoryTotals.get(monthKey)!;
      catMap.set(expense.categoryId, (catMap.get(expense.categoryId) || 0) + expense.amount);
    }

    // Check how many unique months we have (excluding current month if incomplete)
    const now = new Date();
    const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

    const allMonths = Array.from(monthlyTotals.keys()).sort();
    const completedMonths = allMonths.filter((m) => m !== currentMonthKey);
    const monthsOfHistory = completedMonths.length;

    if (monthsOfHistory < 1) {
      return this.createInsufficientDataState();
    }

    // 2. Calculate Confidence
    let confidence = 0;
    let confidenceExplanation = '';

    if (monthsOfHistory >= 6) {
      confidence = 0.9;
      confidenceExplanation = 'High confidence based on 6+ months of historical data.';
    } else if (monthsOfHistory >= 3) {
      confidence = 0.7;
      confidenceExplanation = `Medium confidence based on ${monthsOfHistory} months of historical data.`;
    } else {
      confidence = 0.4;
      confidenceExplanation = `Low confidence based on only ${monthsOfHistory} months of historical data.`;
    }

    // Calculate variance across months to adjust confidence (more variance = less confidence)
    const pastTotals = completedMonths.map((m) => monthlyTotals.get(m)!);
    const meanTotal = pastTotals.reduce((a, b) => a + b, 0) / pastTotals.length;

    let variance = 0;
    if (pastTotals.length > 1) {
      variance =
        pastTotals.reduce((acc, val) => acc + Math.pow(val - meanTotal, 2), 0) / pastTotals.length;
    }
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = meanTotal > 0 ? stdDev / meanTotal : 0;

    // If highly variable spending (CV > 0.3), reduce confidence slightly
    if (coefficientOfVariation > 0.3) {
      confidence = Math.max(0.2, confidence - 0.15);
      confidenceExplanation += ' Spending is highly variable, reducing prediction accuracy.';
    }

    // 3. Current Spend
    const currentSpend = monthlyTotals.get(currentMonthKey) || 0;

    // 4. Calculate Predicted Amounts (Overall and Per Category)
    let predictedTotal = 0;
    const categoryForecasts: CategoryForecast[] = [];
    const risks: ForecastRisk[] = [];

    const categoryAverages = new Map<string, number>();

    // Compute average for each category across completed months
    for (const category of categories) {
      let catTotalSum = 0;
      for (const month of completedMonths) {
        catTotalSum += monthlyCategoryTotals.get(month)?.get(category.id) || 0;
      }
      categoryAverages.set(category.id, catTotalSum / monthsOfHistory);
    }

    const currentMonthCategoryTotals =
      monthlyCategoryTotals.get(currentMonthKey) || new Map<string, number>();

    // Calculate progress through month (0.0 to 1.0)
    // We'll assume a basic pacing based on days
    const daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getDate();
    const currentDay = now.getUTCDate();
    const monthProgress = currentDay / daysInMonth;

    for (const category of categories) {
      const catAvg = categoryAverages.get(category.id) || 0;
      const catCurrent = currentMonthCategoryTotals.get(category.id) || 0;

      // Basic prediction: higher of (current + remaining average) or pacing prediction
      const remainingProgress = 1 - monthProgress;
      const pacingPrediction = monthProgress > 0 ? catCurrent / monthProgress : catAvg;
      const blendedPrediction = pacingPrediction * monthProgress + catAvg * remainingProgress;

      const predictedAmount = Math.max(catCurrent, blendedPrediction);
      predictedTotal += predictedAmount;

      const budget = budgets.find((b) => b.categoryId === category.id)?.limitAmount;
      const varianceVal = budget ? predictedAmount - budget : 0;

      let riskLevel: ForecastRiskLevel = 'low';
      if (budget) {
        const utilization = predictedAmount / budget;
        if (utilization >= 1.0) riskLevel = 'high';
        else if (utilization >= 0.85) riskLevel = 'medium';
      }

      categoryForecasts.push({
        category: category.name,
        currentAmount: catCurrent,
        predictedAmount,
        budget,
        variance: varianceVal,
        riskLevel,
      });

      if (riskLevel === 'high' || riskLevel === 'medium') {
        risks.push({
          category: category.name,
          projectedAmount: predictedAmount,
          budgetAmount: budget!,
          riskLevel,
          explanation:
            riskLevel === 'high'
              ? `Projected to exceed budget by ${Math.round(varianceVal)}.`
              : `Projected to come very close to budget limit.`,
        });
      }
    }

    // 5. Overall bounds based on standard deviation
    // If not enough data, use a simple percentage
    const errorMargin = pastTotals.length > 1 ? stdDev : predictedTotal * 0.15;

    // Bounds narrow as confidence increases and as the month progresses
    const confidenceMultiplier = 2 - confidence; // lower confidence -> wider bounds
    const timeMultiplier = 1 - monthProgress * 0.5; // end of month -> narrower bounds
    const totalMargin = errorMargin * confidenceMultiplier * timeMultiplier;

    const lowerBound = Math.max(currentSpend, predictedTotal - totalMargin);
    const upperBound = predictedTotal + totalMargin;

    return {
      currentSpend,
      predictedAmount: predictedTotal,
      lowerBound,
      upperBound,
      confidence,
      confidenceExplanation,
      categoryForecasts,
      risks,
    };
  }

  private static createInsufficientDataState(): ForecastData {
    return {
      currentSpend: 0,
      predictedAmount: 0,
      lowerBound: 0,
      upperBound: 0,
      confidence: 0,
      confidenceExplanation:
        'Insufficient historical data (less than 1 full month) to generate a reliable forecast.',
      categoryForecasts: [],
      risks: [],
    };
  }
}
