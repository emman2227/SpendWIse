import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { CategoryForecast, Forecast, ForecastRisk, Insight } from '@spendwise/shared';
import type { Model } from 'mongoose';

import { type ForecastDocument, ForecastModel } from './forecast.schema';
import { type InsightDocument, InsightModel } from './insight.schema';

interface ForecastRecordInput {
  userId: string;
  period: Forecast['period'];
  currentSpend: number;
  predictedAmount: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  confidenceExplanation?: string;
  categoryForecasts: CategoryForecast[];
  risks: ForecastRisk[];
  assumptions: string[];
  generatedAt: Date;
}

@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectModel(InsightModel.name)
    private readonly insightModel: Model<InsightModel>,
    @InjectModel(ForecastModel.name)
    private readonly forecastModel: Model<ForecastModel>,
  ) {}

  async replaceInsights(
    userId: string,
    insights: Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>[],
  ) {
    await this.insightModel.deleteMany({ userId }).exec();
    const documents = await this.insightModel.insertMany(insights);
    return documents.map((document) => this.toInsight(document as unknown as InsightDocument));
  }

  async saveForecast(forecast: ForecastRecordInput) {
    const document = await this.forecastModel
      .findOneAndUpdate(
        {
          userId: forecast.userId,
          period: forecast.period,
        },
        forecast,
        {
          upsert: true,
          new: true,
        },
      )
      .exec();

    if (!document) {
      throw new Error('Forecast could not be persisted');
    }

    return this.toForecast(document);
  }

  async getLatestInsights(userId: string) {
    const documents = await this.insightModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20) // Give them more insights now
      .exec();
    return documents.map((document) => this.toInsight(document));
  }

  async getInsightById(id: string, userId: string) {
    const document = await this.insightModel.findOne({ _id: id, userId }).exec();
    return document ? this.toInsight(document) : null;
  }

  async getLatestForecast(userId: string, period: string) {
    const document = await this.forecastModel.findOne({ userId, period }).exec();
    return document ? this.toForecast(document) : null;
  }

  private toInsight(document: InsightDocument): Insight {
    return {
      id: document.id,
      userId: document.userId,
      type: document.type as Insight['type'],
      severity: document.severity as Insight['severity'],
      category: document.category,
      title: document.title,
      message: document.message,
      reason: document.reason,
      evidence: document.evidence as Insight['evidence'],
      impact: document.impact,
      recommendation: document.recommendation,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }

  private toForecast(document: ForecastDocument): Forecast {
    return {
      id: document.id,
      userId: document.userId,
      period: document.period as Forecast['period'],
      currentSpend: document.currentSpend,
      predictedAmount: document.predictedAmount,
      lowerBound: document.lowerBound,
      upperBound: document.upperBound,
      confidence: document.confidence,
      confidenceExplanation: document.confidenceExplanation,
      categoryForecasts: document.categoryForecasts as unknown as CategoryForecast[],
      risks: document.risks as unknown as ForecastRisk[],
      assumptions: document.assumptions,
      generatedAt: document.generatedAt.toISOString(),
    };
  }
}
