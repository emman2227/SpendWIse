import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService as AiAnalyticsService, createAnalyticsProvider } from '@spendwise/ai';
import type { Insight } from '@spendwise/shared';

import { BudgetsService } from '../budgets/budgets.service';
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
    @Inject(AnalyticsRepository)
    private readonly analyticsRepository: AnalyticsRepository,
    @Inject(ConfigService)
    configService: ConfigService,
  ) {
    const provider = createAnalyticsProvider(configService.get<string>('AI_PROVIDER'));
    this.analyticsEngine = new AiAnalyticsService(provider);
  }

  async generate(userId: string) {
    const expenses = await this.expensesService.list(userId, {});
    const [insights, forecast] = await Promise.all([
      this.analyticsEngine.buildInsights(userId, expenses),
      this.analyticsEngine.forecast(userId, expenses, 'monthly'),
    ]);

    const timestamp = new Date().toISOString();
    // TODO: Persist prompt/version metadata alongside generated outputs once real LLM providers are added.
    const insightPayload: Omit<Insight, 'id'>[] = insights.map((insight) => ({
      userId,
      type: insight.type,
      title: insight.title,
      message: insight.message,
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
}
