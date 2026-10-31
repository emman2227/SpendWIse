import type {
  CategorySuggestion,
  Expense,
  ParsedCsvRow,
  ParsedReceiptResult,
  PaymentMethod,
} from '@spendwise/shared';

import type {
  DeepDiveContext,
  DeepDiveResponse,
  InsightInterpretation,
  StructuredForecastInput,
  StructuredInsightInput,
} from '../types';
import { BaseAnalyticsProvider } from './base';

const COMMON_MERCHANT_KEYWORDS: Record<string, string[]> = {
  'Food & Dining': [
    'starbucks',
    'mcdonald',
    'burger',
    'pizza',
    'restaurant',
    'cafe',
    'coffee',
    'doordash',
    'uber eats',
    'grubhub',
    'chipotle',
    'subway',
    'dunkin',
    'taco',
    'bakery',
    'kfc',
    'wendy',
    'bistro',
    'diner',
    'bar',
  ],
  Groceries: [
    'walmart',
    'target',
    'costco',
    'kroger',
    'safeway',
    'whole foods',
    'aldi',
    'trader joe',
    'supermarket',
    'market',
    'grocery',
    'groceries',
    'publix',
    'heb',
  ],
  Transportation: [
    'uber',
    'lyft',
    'shell',
    'chevron',
    'bp',
    'exxon',
    'gas',
    'transit',
    'metro',
    'train',
    'flight',
    'airline',
    'parking',
    'toll',
    'subway transit',
    'petron',
    'caltex',
  ],
  Entertainment: [
    'netflix',
    'spotify',
    'hulu',
    'disney',
    'hbo',
    'cinema',
    'movie',
    'theatre',
    'steam',
    'playstation',
    'nintendo',
    'apple music',
    'youtube',
    'prime video',
  ],
  Utilities: [
    'electric',
    'water',
    'internet',
    'verizon',
    'at&t',
    't-mobile',
    'comcast',
    'utility',
    'bill',
    'power',
    'telecom',
    'broadband',
  ],
  Shopping: [
    'amazon',
    'ebay',
    'zara',
    'nike',
    'adidas',
    'clothing',
    'mall',
    'best buy',
    'store',
    'apple.com',
    'uniqlo',
    'h&m',
    'sephora',
  ],
  Health: [
    'pharmacy',
    'cvs',
    'walgreens',
    'hospital',
    'clinic',
    'dental',
    'doctor',
    'gym',
    'fitness',
    'workout',
    'meds',
    'optometry',
  ],
};

export class DeterministicAnalyticsProvider extends BaseAnalyticsProvider {
  readonly name = 'deterministic';

  private formatCurrency(amount: number, currency = 'USD'): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  }

  async interpretInsights(
    facts: StructuredInsightInput[],
    currency = 'USD',
  ): Promise<InsightInterpretation[]> {
    if (!facts || facts.length === 0) return [];

    return facts.map((fact) => {
      const categoryName = fact.category || 'General';
      const evidence = (fact.evidence || {}) as Record<string, unknown>;
      const type = fact.type as string;

      switch (type) {
        case 'anomaly': {
          const currentVal = evidence.currentAmount ?? evidence.currentSpend;
          const avgVal = evidence.averageAmount ?? evidence.averageSpend;
          const current =
            currentVal != null
              ? this.formatCurrency(Number(currentVal), currency)
              : 'an unusually high amount';
          const avg =
            avgVal != null ? this.formatCurrency(Number(avgVal), currency) : 'historical baseline';
          const multiplier = evidence.multiplier
            ? `${evidence.multiplier}x`
            : evidence.percentChange
              ? `${evidence.percentChange}% higher than`
              : 'significantly above';

          return {
            title: `${categoryName}: Spending Surge Detected`,
            message: `Your spending in ${categoryName} reached ${current}, which is ${multiplier} your typical average of ${avg}.`,
            reason: `Unusual expenditure detected compared to historical standard deviations in ${categoryName}.`,
            impact: `Continuing at this pace may deplete your ${categoryName} budget early.`,
            recommendation: `Review recent ${categoryName} transactions to confirm these are intentional and avoid repeat spikes this month.`,
          };
        }

        case 'budget':
        case 'budget_risk': {
          const rawPct = evidence.budgetUtilization ?? evidence.percentSpent;
          const percent = rawPct != null ? `${Math.round(Number(rawPct))}%` : 'most';
          const limitVal = evidence.budget ?? evidence.budgetLimit;
          const limit =
            limitVal != null ? this.formatCurrency(Number(limitVal), currency) : 'budget limit';
          const spentVal = evidence.currentSpend ?? evidence.currentAmount;
          const spent =
            spentVal != null ? this.formatCurrency(Number(spentVal), currency) : 'allocated funds';

          return {
            title: `${categoryName}: Budget at Risk`,
            message: `You have spent ${spent} (${percent}) of your ${limit} monthly budget for ${categoryName}.`,
            reason: `Spending velocity is currently outpacing the remaining days in the month.`,
            impact: `High risk of exceeding your ${categoryName} budget before the next billing cycle.`,
            recommendation: `Slow down discretionary purchases in ${categoryName} or adjust budget limits from another category.`,
          };
        }

        case 'trend': {
          const rawRate = evidence.percentChange ?? evidence.growthRate;
          const rateNum = rawRate != null ? Math.round(Number(rawRate)) : null;
          const rate = rateNum != null ? `${Math.abs(rateNum)}%` : 'notable';
          const direction = (rateNum ?? 0) >= 0 ? 'increase' : 'decrease';

          return {
            title: `${categoryName}: Monthly Trend Shift`,
            message: `Observed a ${rate} ${direction} in ${categoryName} spending compared to the previous period.`,
            reason: `Pattern changes across your month-over-month transaction volume.`,
            impact:
              direction === 'increase'
                ? `Reduces your overall monthly savings buffer.`
                : `Positively increases your monthly savings rate.`,
            recommendation:
              direction === 'increase'
                ? `Verify whether this shift is temporary or part of a regular recurring commitment.`
                : `Keep up the momentum to allocate remaining surplus toward your savings goals.`,
          };
        }

        case 'goal_opportunity': {
          const surplusVal = evidence.potentialSavings ?? evidence.surplus;
          const surplus =
            surplusVal != null
              ? this.formatCurrency(Number(surplusVal), currency)
              : 'surplus funds';

          return {
            title: 'Surplus Savings Opportunity',
            message: `You have approximately ${surplus} in unallocated surplus this month that could fund your active savings goals.`,
            reason: `Disciplined spending across your main categories has left extra buffer in your budget.`,
            impact: `Accelerates your progress toward target financial milestones.`,
            recommendation: `Consider making an extra contribution toward your highest priority savings goal.`,
          };
        }

        case 'summary':
        default: {
          return {
            title: fact.title || 'Spending is on Track',
            message:
              fact.message ||
              'Your spending patterns are stable and within normal baseline distributions.',
            reason:
              'All recorded expenditures are consistent with your established monthly habits.',
            impact: 'Financial allocations remain balanced and sustainable.',
            recommendation: 'Continue monitoring your weekly dashboard to maintain healthy pacing.',
          };
        }
      }
    });
  }

  async interpretForecast(
    forecast: StructuredForecastInput,
    currency = 'USD',
  ): Promise<{ explanation: string }> {
    const predicted = this.formatCurrency(forecast.predictedAmount || 0, currency);
    const confidencePct = Math.round((forecast.confidence || 0.7) * 100);

    const baseExplanation = `Based on your daily transaction cadence and historical trends, your projected total spend for this month is ${predicted} (${confidencePct}% confidence).`;

    if (forecast.categoryForecasts && forecast.categoryForecasts.length > 0) {
      const topCat = [...forecast.categoryForecasts].sort(
        (a, b) => b.predictedAmount - a.predictedAmount,
      )[0];

      if (topCat && topCat.predictedAmount > 0) {
        const topAmount = this.formatCurrency(topCat.predictedAmount, currency);
        return {
          explanation: `${baseExplanation} Your largest projected category is ${topCat.category} at ${topAmount}.`,
        };
      }
    }

    return { explanation: baseExplanation };
  }

  async deepDive(context: DeepDiveContext & { currency: string }): Promise<DeepDiveResponse> {
    const { insight, expenses, currency = 'USD' } = context;

    const categoryFilter = insight.category?.toLowerCase();
    const relevantExpenses = categoryFilter
      ? expenses.filter((e) => e.categoryId?.toLowerCase() === categoryFilter || !e.categoryId)
      : expenses;

    if (relevantExpenses.length === 0) {
      return {
        answer: `No individual expense entries were found under ${insight.category || 'this category'} for the current analysis period.`,
        suggestedFollowUps: [
          'View all recent expenses',
          'Check category assignments',
          'Refresh analytics insights',
        ],
      };
    }

    const total = relevantExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const count = relevantExpenses.length;
    const avg = total / count;

    const largest = relevantExpenses.reduce(
      (max, curr) => (Number(curr.amount) > Number(max.amount) ? curr : max),
      relevantExpenses[0]!,
    );

    const formattedTotal = this.formatCurrency(total, currency);
    const formattedAvg = this.formatCurrency(avg, currency);
    const formattedMax = this.formatCurrency(Number(largest.amount), currency);
    const dateStr = largest.date ? new Date(largest.date).toLocaleDateString() : 'recent';

    const answer = `In ${insight.category || 'this area'}, you have ${count} recorded transactions totaling ${formattedTotal} (average: ${formattedAvg}). Your single largest transaction was ${formattedMax} on ${dateStr}${largest.description ? ` at "${largest.description}"` : ''}.`;

    return {
      answer,
      suggestedFollowUps: [
        `Show top 5 largest expenses in ${insight.category || 'this category'}`,
        `Compare ${insight.category || 'category'} with last month's budget`,
        'Identify recurring subscriptions',
      ],
    };
  }

  async recommendBudgets(context: {
    expenses: Expense[];
    categories: string[];
    currency: string;
  }): Promise<Array<{ categoryId: string; recommendedAmount: number; explanation: string }>> {
    const { expenses, categories, currency = 'USD' } = context;

    // Group expenses by category
    const catTotals = new Map<string, number>();
    for (const exp of expenses) {
      if (exp.categoryId) {
        catTotals.set(exp.categoryId, (catTotals.get(exp.categoryId) || 0) + Number(exp.amount));
      }
    }

    return categories.map((catId) => {
      const historicalTotal = catTotals.get(catId) || 0;
      // Recommend baseline rounded to nearest 10 with a 5% buffer if > 0, or default 100
      const recommended =
        historicalTotal > 0 ? Math.max(10, Math.round((historicalTotal * 1.05) / 10) * 10) : 100;

      const formatted = this.formatCurrency(recommended, currency);

      return {
        categoryId: catId,
        recommendedAmount: recommended,
        explanation:
          historicalTotal > 0
            ? `Recommended ${formatted} based on your past spending plus a 5% buffer.`
            : `Suggested starting baseline of ${formatted} for this category.`,
      };
    });
  }

  async suggestCategory(
    rawDescription: string,
    categories: Array<{ id: string; name: string }>,
  ): Promise<CategorySuggestion> {
    const fallbackMerchant = rawDescription?.trim() || 'Unknown';
    if (!rawDescription || categories.length === 0) {
      return { normalizedMerchant: fallbackMerchant, confidence: 0 };
    }

    const desc = rawDescription.toLowerCase().trim();

    // 1. Direct match with user's category names
    for (const cat of categories) {
      const catName = cat.name.toLowerCase();
      if (desc.includes(catName) || catName.includes(desc)) {
        return {
          normalizedMerchant: rawDescription.trim(),
          categoryId: cat.id,
          categoryName: cat.name,
          confidence: 0.95,
        };
      }
    }

    // 2. Keyword dictionary lookup
    for (const [groupName, keywords] of Object.entries(COMMON_MERCHANT_KEYWORDS)) {
      const hit = keywords.some((kw) => desc.includes(kw));
      if (hit) {
        // Find best matching user category
        const matchedCategory =
          categories.find((c) => c.name.toLowerCase().includes(groupName.toLowerCase())) ||
          categories.find((c) => groupName.toLowerCase().includes(c.name.toLowerCase()));

        if (matchedCategory) {
          return {
            normalizedMerchant: rawDescription.trim(),
            categoryId: matchedCategory.id,
            categoryName: matchedCategory.name,
            confidence: 0.88,
          };
        }
      }
    }

    // Fallback: If no match, return low confidence
    return { normalizedMerchant: fallbackMerchant, confidence: 0 };
  }

  async parseCsvTransactions(
    csvContent: string,
    categories: Array<{ id: string; name: string }>,
  ): Promise<ParsedCsvRow[]> {
    if (!csvContent || !csvContent.trim()) return [];

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) return [];

    const header = lines[0]!.toLowerCase().split(/[,;\t]/);
    const dateIdx = header.findIndex((h) => h.includes('date'));
    const amountIdx = header.findIndex(
      (h) => h.includes('amount') || h.includes('cost') || h.includes('total'),
    );
    const descIdx = header.findIndex(
      (h) =>
        h.includes('desc') || h.includes('merchant') || h.includes('title') || h.includes('payee'),
    );
    const paymentMethodIdx = header.findIndex(
      (h) => h.includes('payment') || h.includes('method') || h.includes('type'),
    );

    const validPayments: PaymentMethod[] = [
      'cash',
      'credit_card',
      'debit_card',
      'bank_transfer',
      'e_wallet',
    ];

    const rows: ParsedCsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i]!.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 2) continue;

      const rawAmount = parts[amountIdx >= 0 ? amountIdx : 1] || '0';
      const cleanAmount = Math.abs(parseFloat(rawAmount.replace(/[^0-9.-]+/g, '')) || 0);

      const rawDate = parts[dateIdx >= 0 ? dateIdx : 0] || new Date().toISOString();
      const description = parts[descIdx >= 0 ? descIdx : 2] || 'Imported Transaction';
      const rawPayment = (paymentMethodIdx >= 0 ? parts[paymentMethodIdx] : '')
        ?.toLowerCase()
        .trim();
      const paymentMethod: PaymentMethod = validPayments.includes(rawPayment as PaymentMethod)
        ? (rawPayment as PaymentMethod)
        : 'credit_card';

      // Auto-suggest category
      const suggestion = await this.suggestCategory(description, categories);

      rows.push({
        date: rawDate,
        amount: cleanAmount,
        description,
        categoryId: suggestion.categoryId || categories[0]?.id || '',
        paymentMethod,
        notes: `Imported via CSV`,
      });
    }

    return rows;
  }

  async parseReceipt(
    _imageBase64: string,
    _mimeType: string,
    categories: Array<{ id: string; name: string }>,
  ): Promise<ParsedReceiptResult> {
    const defaultCatName = categories[0]?.name || 'General';

    return {
      merchant: 'Receipt Scan (Deterministic Provider)',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      categoryName: defaultCatName,
      confidence: 0.1,
      paymentMethod: 'credit_card',
      notes: 'Deterministic receipt scanner placeholder. OCR integration queued for next step.',
    };
  }
}
