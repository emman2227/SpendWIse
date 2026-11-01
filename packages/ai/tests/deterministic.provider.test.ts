import { describe, expect, it } from 'vitest';

import { DeterministicAnalyticsProvider } from '../src/providers/deterministic-provider';
import { GeminiAnalyticsProvider } from '../src/providers/gemini-provider';
import { MockAiProvider } from '../src/providers/mock-ai-provider';
import { createAnalyticsProvider } from '../src/services/provider-factory';
import type {
  Expense,
  Insight,
  StructuredForecastInput,
  StructuredInsightInput,
} from '../src/types';

describe('DeterministicAnalyticsProvider', () => {
  const provider = new DeterministicAnalyticsProvider();

  describe('interpretInsights', () => {
    it('returns empty array when no facts are provided', async () => {
      const results = await provider.interpretInsights([]);
      expect(results).toEqual([]);
    });

    it('interprets anomaly facts with financial advice', async () => {
      const facts: StructuredInsightInput[] = [
        {
          type: 'anomaly',
          severity: 'warning',
          category: 'Dining',
          title: 'Dining Surge',
          message: 'You spent 350 on dining',
          evidence: {
            currentAmount: 350,
            averageAmount: 150,
            multiplier: 2.3,
          },
        },
      ];

      const [res] = await provider.interpretInsights(facts, 'USD');
      expect(res).toBeDefined();
      expect(res?.title).toContain('Dining');
      expect(res?.reason).toBeDefined();
      expect(res?.impact).toBeDefined();
      expect(res?.recommendation).toBeDefined();
    });

    it('interprets budget risk facts with remaining pace advice', async () => {
      const facts: StructuredInsightInput[] = [
        {
          type: 'budget_risk',
          severity: 'critical',
          category: 'Shopping',
          title: 'Shopping Budget Danger',
          message: 'Over limit',
          evidence: {
            budgetLimit: 500,
            currentSpend: 475,
            percentSpent: 95,
          },
        },
      ];

      const [res] = await provider.interpretInsights(facts, 'USD');
      expect(res).toBeDefined();
      expect(res?.title).toContain('Shopping');
      expect(res?.message).toContain('95%');
      expect(res?.recommendation).toContain('Shopping');
    });

    it('interprets trend facts with directional shift', async () => {
      const facts: StructuredInsightInput[] = [
        {
          type: 'trend',
          severity: 'info',
          category: 'Transport',
          title: 'Transport Trend',
          message: 'Transport up 30%',
          evidence: {
            growthRate: 30,
          },
        },
      ];

      const [res] = await provider.interpretInsights(facts, 'USD');
      expect(res).toBeDefined();
      expect(res?.message).toContain('30% increase');
      expect(res?.impact).toContain('savings buffer');
    });

    it('interprets goal opportunity facts', async () => {
      const facts: StructuredInsightInput[] = [
        {
          type: 'goal_opportunity',
          severity: 'info',
          title: 'Extra savings available',
          message: 'Surplus detected',
          evidence: {
            potentialSavings: 200,
          },
        },
      ];

      const [res] = await provider.interpretInsights(facts, 'USD');
      expect(res).toBeDefined();
      expect(res?.title).toContain('Surplus');
      expect(res?.recommendation).toContain('savings goal');
    });
  });

  describe('interpretForecast', () => {
    it('returns projected spend and confidence metrics', async () => {
      const forecast: StructuredForecastInput = {
        predictedAmount: 1450.5,
        confidence: 0.85,
        categoryForecasts: [
          { category: 'Rent', predictedAmount: 800 },
          { category: 'Groceries', predictedAmount: 400 },
        ],
      };

      const result = await provider.interpretForecast(forecast, 'USD');
      expect(result.explanation).toContain('$1,450.50');
      expect(result.explanation).toContain('85%');
      expect(result.explanation).toContain('Rent');
    });
  });

  describe('deepDive', () => {
    it('aggregates category expenses into factual summary', async () => {
      const mockInsight: Insight = {
        id: 'ins-1',
        userId: 'user-1',
        type: 'anomaly',
        severity: 'warning',
        category: 'Food',
        title: 'High Food Spend',
        message: 'Alert',
        evidence: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockExpenses: Expense[] = [
        {
          id: 'exp-1',
          userId: 'user-1',
          categoryId: 'food',
          amount: 50,
          description: 'Lunch at Cafe',
          date: '2026-10-15T00:00:00.000Z',
          paymentMethod: 'credit_card',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'exp-2',
          userId: 'user-1',
          categoryId: 'food',
          amount: 150,
          description: 'Dinner Party',
          date: '2026-10-20T00:00:00.000Z',
          paymentMethod: 'credit_card',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const res = await provider.deepDive({
        insight: mockInsight,
        question: 'Why is food so high?',
        expenses: mockExpenses,
        currency: 'USD',
      });

      expect(res.answer).toContain('2 recorded transactions');
      expect(res.answer).toContain('$200.00');
      expect(res.answer).toContain('$150.00');
      expect(res.answer).toContain('Dinner Party');
      expect(res.suggestedFollowUps.length).toBeGreaterThan(0);
    });

    it('handles deep dive when no expenses match the category', async () => {
      const mockInsight: Insight = {
        id: 'ins-1',
        userId: 'user-1',
        type: 'anomaly',
        severity: 'info',
        category: 'Nonexistent',
        title: 'Empty Category',
        message: 'No data',
        evidence: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await provider.deepDive({
        insight: mockInsight,
        question: 'Any expenses?',
        expenses: [],
        currency: 'USD',
      });

      expect(res.answer).toContain('No individual expense entries');
      expect(res.suggestedFollowUps.length).toBe(3);
    });
  });

  describe('recommendBudgets', () => {
    it('computes budget targets from past category totals', async () => {
      const mockExpenses: Expense[] = [
        {
          id: '1',
          userId: 'u1',
          categoryId: 'cat-food',
          amount: 200,
          description: 'Groceries',
          date: new Date().toISOString(),
          paymentMethod: 'card',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const recs = await provider.recommendBudgets({
        expenses: mockExpenses,
        categories: ['cat-food', 'cat-transport'],
        currency: 'USD',
      });

      expect(recs.length).toBe(2);
      const foodRec = recs.find((r) => r.categoryId === 'cat-food');
      expect(foodRec?.recommendedAmount).toBe(210); // 200 * 1.05 = 210
      const transportRec = recs.find((r) => r.categoryId === 'cat-transport');
      expect(transportRec?.recommendedAmount).toBe(100); // default
    });
  });

  describe('suggestCategory', () => {
    const categories = [
      { id: 'c1', name: 'Food & Dining' },
      { id: 'c2', name: 'Transportation' },
      { id: 'c3', name: 'Entertainment' },
    ];

    it('matches merchant keywords from dictionary', async () => {
      const res = await provider.suggestCategory('STARBUCKS STORE #124', categories);
      expect(res.categoryId).toBe('c1');
      expect(res.categoryName).toBe('Food & Dining');
      expect(res.confidence).toBeGreaterThan(0.8);
    });

    it('matches user category name directly', async () => {
      const res = await provider.suggestCategory('Uber Trip', categories);
      expect(res.categoryId).toBe('c2');
      expect(res.categoryName).toBe('Transportation');
    });

    it('returns low confidence when merchant is unknown', async () => {
      const res = await provider.suggestCategory('XYZ UNKNOWN MERCHANT 999', categories);
      expect(res.confidence).toBe(0);
    });
  });

  describe('parseCsvTransactions', () => {
    const categories = [
      { id: 'c1', name: 'Food & Dining' },
      { id: 'c2', name: 'Transportation' },
    ];

    it('parses valid CSV rows with auto-categorization', async () => {
      const csv = `Date,Description,Amount\n2026-10-01,Starbucks,4.75\n2026-10-02,Shell Gas Station,45.00`;
      const rows = await provider.parseCsvTransactions(csv, categories);

      expect(rows.length).toBe(2);
      expect(rows[0]?.amount).toBe(4.75);
      expect(rows[0]?.description).toBe('Starbucks');
      expect(rows[0]?.categoryId).toBe('c1');
      expect(rows[1]?.amount).toBe(45);
      expect(rows[1]?.categoryId).toBe('c2');
    });
  });

  describe('parseReceiptText', () => {
    const categories = [
      { id: 'cat-dining', name: 'Food & Dining' },
      { id: 'cat-transport', name: 'Transportation' },
      { id: 'cat-groceries', name: 'Groceries' },
    ];

    it('parses standard receipt text with merchant, amount, date, and payment method', async () => {
      const receiptText = `
        OFFICIAL RECEIPT
        STARBUCKS COFFEE #1204
        Date: 2026-10-15
        Order: #49281
        1x Caramel Macchiato   180.00
        1x Blueberry Muffin     120.00
        SUBTOTAL               300.00
        TAX                     36.00
        TOTAL AMOUNT DUE:      ₱336.00
        PAID VIA GCASH
      `;

      const result = await provider.parseReceiptText(receiptText, categories);
      expect(result.merchant).toContain('STARBUCKS COFFEE');
      expect(result.amount).toBe(336);
      expect(result.date).toBe('2026-10-15');
      expect(result.categoryName).toBe('Food & Dining');
      expect(result.paymentMethod).toBe('e_wallet');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('extracts date in slash format and cash payment method', async () => {
      const receiptText = `
        SHELL MOBILITY STATION
        10/24/2026 14:30
        FUEL REGULAR         1,250.00
        TOTAL: 1250.00
        CASH TENDERED: 1500.00
        CHANGE DUE: 250.00
      `;

      const result = await provider.parseReceiptText(receiptText, categories);
      expect(result.merchant).toContain('SHELL MOBILITY');
      expect(result.amount).toBe(1250);
      expect(result.date).toBe('2026-10-24');
      expect(result.categoryName).toBe('Transportation');
      expect(result.paymentMethod).toBe('cash');
    });

    it('handles empty receipt text gracefully without throwing', async () => {
      const result = await provider.parseReceiptText('', categories);
      expect(result.merchant).toBe('Unrecognized Receipt');
      expect(result.amount).toBe(0);
      expect(result.confidence).toBe(0.1);
      expect(result.notes).toContain('No text could be extracted');
    });
  });
});

describe('createAnalyticsProvider factory', () => {
  it('defaults to DeterministicAnalyticsProvider when no provider is passed', () => {
    const provider = createAnalyticsProvider();
    expect(provider).toBeInstanceOf(DeterministicAnalyticsProvider);
    expect(provider.name).toBe('deterministic');
  });

  it('instantiates DeterministicAnalyticsProvider explicitly', () => {
    const provider = createAnalyticsProvider('deterministic');
    expect(provider).toBeInstanceOf(DeterministicAnalyticsProvider);
  });

  it('instantiates MockAiProvider when requested', () => {
    const provider = createAnalyticsProvider('mock');
    expect(provider).toBeInstanceOf(MockAiProvider);
  });

  it('instantiates GeminiAnalyticsProvider when requested', () => {
    const provider = createAnalyticsProvider('gemini', 'test-api-key');
    expect(provider).toBeInstanceOf(GeminiAnalyticsProvider);
    expect(provider.name).toBe('gemini');
  });
});
