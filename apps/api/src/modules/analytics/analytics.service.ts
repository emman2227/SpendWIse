import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AnalyticsProvider } from '@spendwise/ai';
import { createAnalyticsProvider } from '@spendwise/ai';

import { BudgetsService } from '../budgets/budgets.service';
import { CategoriesService } from '../categories/categories.service';
import { ExpensesService } from '../expenses/expenses.service';
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

    const user = await this.usersService.getProfile(userId);
    const currency = user.currency || 'USD';

    // 1. Deterministic Analysis
    const structuredFacts = SpendingAnalyzer.analyze(expenses, budgets, categories);

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

    // Calculate current vs previous spend per category
    const currentSpendByCat = currentExpenses.reduce<Record<string, number>>((acc, exp) => {
      acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
      return acc;
    }, {});

    const budgets = await this.budgetsService.list(userId, currentMonth, currentYear);
    const budgetMap = new Map(budgets.map((b) => [b.categoryId, b.limitAmount]));

    const comparisons = Object.entries(currentSpendByCat).map(([categoryId, current]) => {
      const category = categoryMap.get(categoryId);
      const catForecast = forecast?.categoryForecasts?.find((cf) => cf.category === categoryId);

      return {
        label: category?.name || 'Unknown',
        current,
        projected: catForecast?.predictedAmount || current,
        budget: budgetMap.get(categoryId),
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
}
