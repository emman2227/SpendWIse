import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  Alert,
  AlertStatus,
  CategoryForecast,
  Forecast,
  ForecastRisk,
  Insight,
} from '@spendwise/shared';
import type { Model } from 'mongoose';

import { type AlertDocument, AlertModel } from './alert.schema';
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
    @InjectModel(AlertModel.name)
    private readonly alertModel: Model<AlertModel>,
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

  async syncAlerts(
    userId: string,
    detectedAlerts: Array<Omit<Alert, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>>,
  ): Promise<Alert[]> {
    const existing = await this.alertModel.find({ userId }).exec();
    const existingMap = new Map<string, AlertDocument>();

    for (const doc of existing) {
      const key = `${doc.type}:${doc.transactionId || doc.categoryId || doc.merchant}:${doc.amount}`;
      existingMap.set(key, doc);
    }

    const toInsert: Array<Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>> = [];
    for (const a of detectedAlerts) {
      const key = `${a.type}:${a.transactionId || a.categoryId || a.merchant}:${a.amount}`;
      if (!existingMap.has(key)) {
        toInsert.push({
          ...a,
          userId,
          status: 'pending',
        });
      }
    }

    if (toInsert.length > 0) {
      await this.alertModel.insertMany(toInsert);
    }

    const allDocs = await this.alertModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return allDocs.map((doc) => this.toAlert(doc));
  }

  async findAlerts(userId: string, status?: AlertStatus): Promise<Alert[]> {
    const query: Record<string, unknown> = { userId };
    if (status) {
      query.status = status;
    }
    const documents = await this.alertModel.find(query).sort({ createdAt: -1 }).exec();
    return documents.map((doc) => this.toAlert(doc));
  }

  async getAlertById(id: string, userId: string): Promise<Alert | null> {
    const document = await this.alertModel.findOne({ _id: id, userId }).exec();
    return document ? this.toAlert(document) : null;
  }

  async updateAlertStatus(
    userId: string,
    alertId: string,
    status: AlertStatus,
  ): Promise<Alert | null> {
    const document = await this.alertModel
      .findOneAndUpdate({ _id: alertId, userId }, { status }, { new: true })
      .exec();
    return document ? this.toAlert(document) : null;
  }

  async dismissAllAlerts(userId: string): Promise<number> {
    const result = await this.alertModel
      .updateMany({ userId, status: { $ne: 'dismissed' } }, { status: 'dismissed' })
      .exec();
    return result.modifiedCount;
  }

  private toAlert(document: AlertDocument): Alert {
    return {
      id: document.id,
      userId: document.userId,
      type: document.type,
      severity: document.severity,
      status: document.status,
      merchant: document.merchant,
      category: document.category,
      categoryId: document.categoryId,
      amount: document.amount,
      date: document.date,
      reason: document.reason,
      suggestedAction: document.suggestedAction,
      evidence: document.evidence,
      transactionId: document.transactionId,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
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
