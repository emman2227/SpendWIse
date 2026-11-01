import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AnalyticsProvider } from '@spendwise/ai';
import { createAnalyticsProvider } from '@spendwise/ai';
import type { Alert, AlertStatus } from '@spendwise/shared';

import { BudgetsService } from '../budgets/budgets.service';
import { CategoriesService } from '../categories/categories.service';
import { ExpensesService } from '../expenses/expenses.service';
import { GoalsService } from '../goals/goals.service';
import { UsersService } from '../users/users.service';
import { AnalyticsRepository } from './analytics.repository';
import { ForecastEngine } from './forecast-engine';
import { SpendingAnalyzer } from './spending-analyzer';

@Injectable()
export class AnalyticsService {
  private readonly provider: AnalyticsProvider;

  constructor(
    @Inject(ExpensesService)
    private readonly expensesService: ExpensesService,
    @Inject(BudgetsService)
    private readonly budgetsService: BudgetsService,
    @Inject(CategoriesService)
    private readonly categoriesService: CategoriesService,
    @Inject(GoalsService)
    private readonly goalsService: GoalsService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(AnalyticsRepository)
    private readonly analyticsRepository: AnalyticsRepository,
    @Inject(ConfigService)
    configService: ConfigService,
  ) {
    this.provider = createAnalyticsProvider(
      configService.get<string>('AI_PROVIDER'),
      configService.get<string>('GEMINI_API_KEY') ||
        configService.get<string>('GOOGLE_GENERATIVE_AI_API_KEY'),
    );
  }

  async generate(userId: string) {
    const currentMonth = new Date().getUTCMonth();
    const currentYear = new Date().getUTCFullYear();

    const expenses = await this.expensesService.list(userId, {});
    const budgets = await this.budgetsService.list(userId, currentMonth, currentYear);
    const categories = await this.categoriesService.list(userId);
    const goals = await this.goalsService.list(userId);

    const user = await this.usersService.getProfile(userId);
    const currency = user.currency || 'USD';

    // 1. Deterministic Analysis
    const structuredFacts = SpendingAnalyzer.analyze(expenses, budgets, categories, goals);

    // 2. AI Interpretation
    const interpretations = await this.provider.interpretInsights(structuredFacts, currency);

    // 3. Merge Facts + Interpretation
    const insightPayload = structuredFacts.map((fact, index) => {
      const interp = interpretations[index] || {
        title: fact.title,
        message: fact.message,
      };

      return {
        userId,
        type: fact.type,
        severity: fact.severity,
        category: fact.category,
        title: interp.title || fact.title,
        message: interp.message || fact.message,
        reason: interp.reason,
        evidence: fact.evidence,
        impact: interp.impact,
        recommendation: interp.recommendation,
      };
    });

    const savedInsights = await this.analyticsRepository.replaceInsights(userId, insightPayload);

    // 4. Forecast Engine

    const currentExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
    });

    const historicalExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getUTCMonth() !== currentMonth || d.getUTCFullYear() !== currentYear;
    });

    const forecastData = ForecastEngine.computeForecast(
      currentExpenses,
      historicalExpenses,
      budgets,
      categories,
    );
    const period = 'monthly';

    // 5. AI Forecast Interpretation
    const forecastInterp = await this.provider.interpretForecast(
      {
        period,
        assumptions: [],
        ...forecastData,
      },
      currency,
    );

    const savedForecast = await this.analyticsRepository.saveForecast({
      userId,
      period,
      currentSpend: forecastData.currentSpend,
      predictedAmount: forecastData.predictedAmount,
      lowerBound: forecastData.lowerBound,
      upperBound: forecastData.upperBound,
      confidence: forecastData.confidence,
      confidenceExplanation: forecastInterp.explanation || forecastData.confidenceExplanation,
      categoryForecasts: forecastData.categoryForecasts,
      risks: forecastData.risks,
      assumptions: [],
      generatedAt: new Date(),
    });

    return {
      insights: savedInsights,
      forecast: savedForecast,
    };
  }

  async getDashboard(userId: string) {
    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();

    const [expenses, budgetSummary, insights, forecast] = await Promise.all([
      this.expensesService.list(userId, { month, year }),
      this.budgetsService.getSummary(userId, month, year),
      this.analyticsRepository.getLatestInsights(userId),
      this.analyticsRepository.getLatestForecast(userId, 'monthly'),
    ]);

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryBreakdown = Object.entries(
      expenses.reduce<Record<string, number>>((accumulator, expense) => {
        accumulator[expense.categoryId] = (accumulator[expense.categoryId] ?? 0) + expense.amount;
        return accumulator;
      }, {}),
    ).map(([categoryId, amount]) => ({
      categoryId,
      amount,
    }));

    return {
      totals: {
        totalExpenses,
        transactionCount: expenses.length,
      },
      budgetSummary,
      recentTransactions: expenses.slice(0, 5),
      categoryBreakdown,
      insights,
      forecast,
    };
  }

  async getForecastDetails(userId: string) {
    const now = new Date();
    const currentMonth = now.getUTCMonth() + 1;
    const currentYear = now.getUTCFullYear();

    const [categories, currentExpenses, forecast] = await Promise.all([
      this.categoriesService.list(userId),
      this.expensesService.list(userId, { month: currentMonth, year: currentYear }),
      this.analyticsRepository.getLatestForecast(userId, 'monthly'),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const categoryNameMap = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

    // Calculate current spend per category
    const currentSpendByCat = currentExpenses.reduce<Record<string, number>>((acc, exp) => {
      acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
      return acc;
    }, {});

    const budgets = await this.budgetsService.list(userId, currentMonth, currentYear);
    const budgetMap = new Map(budgets.map((b) => [b.categoryId, b.limitAmount]));

    // Helper to find category forecast matching either category name or category id
    const findCategoryForecast = (catId?: string, catName?: string) => {
      if (!forecast?.categoryForecasts) return undefined;
      return forecast.categoryForecasts.find((cf) => {
        if (catId && (cf.category === catId || cf.category.toLowerCase() === catId.toLowerCase())) {
          return true;
        }
        if (
          catName &&
          (cf.category === catName || cf.category.toLowerCase() === catName.toLowerCase())
        ) {
          return true;
        }
        return false;
      });
    };

    type SynthesizedCategory = {
      id?: string;
      label: string;
      color: string;
      current: number;
      projected: number;
      budget?: number;
    };

    const synthesizedMap = new Map<string, SynthesizedCategory>();

    // 1. Seed from user's configured categories
    for (const cat of categories) {
      const current = currentSpendByCat[cat.id] || 0;
      const catForecast = findCategoryForecast(cat.id, cat.name);
      const projected = catForecast?.predictedAmount ?? catForecast?.currentAmount ?? current;
      const budget = budgetMap.get(cat.id);

      synthesizedMap.set(cat.name.toLowerCase(), {
        id: cat.id,
        label: cat.name,
        color: cat.color || '#0F7B71',
        current,
        projected,
        budget,
      });
    }

    // 2. Add any categories from forecast that weren't in categories
    if (forecast?.categoryForecasts) {
      for (const cf of forecast.categoryForecasts) {
        const key = cf.category.toLowerCase();
        if (!synthesizedMap.has(key)) {
          const matchedCat =
            categoryNameMap.get(key) || (cf.category ? categoryMap.get(cf.category) : undefined);
          synthesizedMap.set(key, {
            id: matchedCat?.id,
            label: matchedCat?.name || cf.category,
            color: matchedCat?.color || '#0F7B71',
            current: cf.currentAmount || 0,
            projected: cf.predictedAmount || cf.currentAmount || 0,
            budget: cf.budget || (matchedCat?.id ? budgetMap.get(matchedCat.id) : undefined),
          });
        }
      }
    }

    // 3. Add any categories from current spend not already captured
    for (const [catId, current] of Object.entries(currentSpendByCat)) {
      const cat = categoryMap.get(catId);
      const key = (cat?.name || catId).toLowerCase();
      if (!synthesizedMap.has(key)) {
        synthesizedMap.set(key, {
          id: catId,
          label: cat?.name || 'Unknown',
          color: cat?.color || '#0F7B71',
          current,
          projected: current,
          budget: budgetMap.get(catId),
        });
      }
    }

    const allSynthesized = Array.from(synthesizedMap.values());

    // Filter to active categories: those with spending, projection > 0, or an active budget
    let activeCategories = allSynthesized.filter(
      (cat) => cat.current > 0 || cat.projected > 0 || cat.budget !== undefined,
    );

    // If completely empty (e.g. brand new user with 0 historical/current spend and 0 budgets),
    // fallback to first 5 categories so charts and simulator remain actionable
    if (activeCategories.length === 0 && allSynthesized.length > 0) {
      activeCategories = allSynthesized.slice(0, 5);
    }

    // Sort by projected spend descending so top spending drivers appear first
    activeCategories.sort((a, b) => b.projected - a.projected || b.current - a.current);

    const comparisons = activeCategories.map((c) => ({
      label: c.label,
      current: c.current,
      projected: c.projected,
      budget: c.budget,
    }));

    // Share computation: based on projected spend (or current if projected is 0)
    const totalProjectedSpend = activeCategories.reduce(
      (sum, c) => sum + (c.projected > 0 ? c.projected : c.current),
      0,
    );
    const defaultColors = [
      '#0F7B71',
      '#29B8A8',
      '#CE9844',
      '#157B63',
      '#E2634D',
      '#5B6A7D',
      '#6366F1',
    ];

    const share = activeCategories
      .filter((c) => (c.projected > 0 ? c.projected : c.current) > 0)
      .map((c, idx) => {
        const amount = c.projected > 0 ? c.projected : c.current;
        return {
          name: c.label,
          amount,
          share: totalProjectedSpend > 0 ? Math.round((amount / totalProjectedSpend) * 100) : 0,
          color:
            c.color && c.color !== '#0F7B71' ? c.color : defaultColors[idx % defaultColors.length],
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const totalCurrentSpend = Object.values(currentSpendByCat).reduce((a, b) => a + b, 0);

    return {
      metrics: {
        predictedAmount: forecast?.predictedAmount || totalCurrentSpend,
        confidence: forecast?.confidence || 0.7,
      },
      comparisons,
      share,
      forecastData: forecast,
    };
  }

  async getInsightDetails(userId: string, insightId: string) {
    return this.analyticsRepository.getInsightById(insightId, userId);
  }

  async deepDiveInsight(userId: string, insightId: string, question: string) {
    const insight = await this.analyticsRepository.getInsightById(insightId, userId);
    if (!insight) {
      throw new Error('Insight not found');
    }

    const expenses = await this.expensesService.list(userId, {});
    const user = await this.usersService.getProfile(userId);
    const currency = user.currency || 'USD';

    const response = await this.provider.deepDive({
      insight,
      question,
      expenses,
      currency,
    });

    return response;
  }

  async recommendBudgets(userId: string) {
    const expenses = await this.expensesService.list(userId, {});
    const categories = await this.categoriesService.list(userId);
    const user = await this.usersService.getProfile(userId);
    const currency = user.currency || 'USD';

    // To prevent passing too much data to the LLM, limit the expenses to the last 6 months or simplify them
    const recentExpenses = expenses.slice(0, 200).map((e) => ({
      amount: e.amount,
      categoryId: e.categoryId,
      date: e.date,
      description: e.description,
    }));
    const categoryInfo = categories.map((c) => c.id + ': ' + c.name);

    return this.provider.recommendBudgets({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expenses: recentExpenses as any,
      categories: categoryInfo,
      currency,
    });
  }

  async getAlerts(
    userId: string,
    status?: AlertStatus,
    forceScan: boolean = false,
  ): Promise<Alert[]> {
    const existing = await this.analyticsRepository.findAlerts(userId, status);

    if (existing.length === 0 || forceScan) {
      return this.generateAlerts(userId, status);
    }

    return existing;
  }

  async generateAlerts(userId: string, statusFilter?: AlertStatus): Promise<Alert[]> {
    const currentMonth = new Date().getUTCMonth();
    const currentYear = new Date().getUTCFullYear();

    const [expenses, budgets, categories] = await Promise.all([
      this.expensesService.list(userId, {}),
      this.budgetsService.list(userId, currentMonth, currentYear),
      this.categoriesService.list(userId),
    ]);

    const detected = SpendingAnalyzer.detectAlerts(expenses, budgets, categories);
    const synced = await this.analyticsRepository.syncAlerts(userId, detected);

    if (statusFilter) {
      return synced.filter((a) => a.status === statusFilter);
    }

    return synced;
  }

  async updateAlertStatus(userId: string, alertId: string, status: AlertStatus): Promise<Alert> {
    const updated = await this.analyticsRepository.updateAlertStatus(userId, alertId, status);
    if (!updated) {
      throw new Error('Alert not found');
    }
    return updated;
  }

  async dismissAllAlerts(userId: string): Promise<{ dismissedCount: number }> {
    const count = await this.analyticsRepository.dismissAllAlerts(userId);
    return { dismissedCount: count };
  }
}
