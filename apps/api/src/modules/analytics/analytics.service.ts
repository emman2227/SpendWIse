import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService as AiAnalyticsService, createAnalyticsProvider } from '@spendwise/ai';
import type { Insight } from '@spendwise/shared';

import { BudgetsService } from '../budgets/budgets.service';
import { CategoriesService } from '../categories/categories.service';
import { ExpensesService } from '../expenses/expenses.service';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  private readonly analyticsEngine: AiAnalyticsService;

  constructor(
    @Inject(ExpensesService)
    private readonly expensesService: ExpensesService,
    @Inject(BudgetsService)
    private readonly budgetsService: BudgetsService,
    @Inject(CategoriesService)
    private readonly categoriesService: CategoriesService,
    @Inject(AnalyticsRepository)
    private readonly analyticsRepository: AnalyticsRepository,
    @Inject(ConfigService)
    configService: ConfigService,
  ) {
    const provider = createAnalyticsProvider(
      configService.get<string>('AI_PROVIDER'),
      configService.get<string>('GEMINI_API_KEY'),
    );
    this.analyticsEngine = new AiAnalyticsService(provider);
  }

  async generate(userId: string) {
    const expenses = await this.expensesService.list(userId, {});
    const [insights, forecast] = await Promise.all([
      this.analyticsEngine.buildInsights(userId, expenses),
      this.analyticsEngine.forecast(userId, expenses, 'monthly'),
    ]);

    const timestamp = new Date().toISOString();
    const insightPayload: Omit<Insight, 'id'>[] = insights.map((insight) => ({
      userId,
      type: insight.type,
      title: insight.title,
      message: insight.message,
      ...(insight.metadata ? { metadata: insight.metadata } : {}),
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    const savedInsights = await this.analyticsRepository.replaceInsights(userId, insightPayload);

    const savedForecast = await this.analyticsRepository.saveForecast({
      userId,
      period: forecast.period,
      predictedAmount: forecast.predictedAmount,
      confidence: forecast.confidence,
      generatedAt: new Date(forecast.generatedAt),
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

    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [categories, currentExpenses, previousExpenses, forecast] = await Promise.all([
      this.categoriesService.list(userId),
      this.expensesService.list(userId, { month: currentMonth, year: currentYear }),
      this.expensesService.list(userId, { month: previousMonth, year: previousYear }),
      this.analyticsRepository.getLatestForecast(userId, 'monthly'),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Calculate current vs previous spend per category
    const currentSpendByCat = currentExpenses.reduce<Record<string, number>>((acc, exp) => {
      acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
      return acc;
    }, {});

    const previousSpendByCat = previousExpenses.reduce<Record<string, number>>((acc, exp) => {
      acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
      return acc;
    }, {});

    const comparisons = Object.entries(currentSpendByCat).map(([categoryId, current]) => {
      const category = categoryMap.get(categoryId);
      return {
        label: category?.name || 'Unknown',
        current,
        previous: previousSpendByCat[categoryId] || 0,
      };
    });

    // Share computation
    const totalCurrentSpend = Object.values(currentSpendByCat).reduce((a, b) => a + b, 0);
    const share = Object.entries(currentSpendByCat).map(([categoryId, amount]) => {
      const category = categoryMap.get(categoryId);
      return {
        name: category?.name || 'Unknown',
        amount,
        share: totalCurrentSpend > 0 ? Math.round((amount / totalCurrentSpend) * 100) : 0,
        color: category?.color || '#0F7B71',
      };
    });

    // Sort share to show largest first
    share.sort((a, b) => b.amount - a.amount);

    return {
      metrics: {
        predictedAmount: forecast?.predictedAmount || totalCurrentSpend,
        confidence: forecast?.confidence || 0.7,
      },
      comparisons,
      share,
    };
  }
}
