import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { Forecast, Insight } from '@spendwise/shared';

import { ForecastModel, type ForecastDocument } from './forecast.schema';
import { InsightModel, type InsightDocument } from './insight.schema';

interface ForecastRecordInput {
  userId: string;
  period: Forecast['period'];
  predictedAmount: number;
  confidence: number;
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

  async replaceInsights(userId: string, insights: Omit<Insight, 'id'>[]) {
    await this.insightModel.deleteMany({ userId }).exec();
    const documents = await this.insightModel.insertMany(insights);
    return documents.map((document) => this.toInsight(document as unknown as InsightDocument));
  }

  async saveForecast(forecast: ForecastRecordInput) {
    const document = await this.forecastModel
      .findOneAndUpdate(
        {
          userId: forecast.userId,
          period: forecast.period
        },
        forecast,
        {
          upsert: true,
          new: true
        },
      )
      .exec();

    if (!document) {
      throw new Error('Forecast could not be persisted');
    }

    return this.toForecast(document);
  }

  async getLatestInsights(userId: string) {
    const documents = await this.insightModel.find({ userId }).sort({ createdAt: -1 }).limit(5).exec();
    return documents.map((document) => this.toInsight(document));
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
      title: document.title,
      message: document.message,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString()
    };
  }

  private toForecast(document: ForecastDocument): Forecast {
    return {
      id: document.id,
      userId: document.userId,
      period: document.period as Forecast['period'],
      predictedAmount: document.predictedAmount,
      confidence: document.confidence,
      generatedAt: document.generatedAt.toISOString()
    };
  }
}
