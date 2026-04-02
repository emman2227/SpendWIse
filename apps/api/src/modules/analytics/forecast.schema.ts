import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'forecasts',
  timestamps: false,
  versionKey: false
})
export class ForecastModel {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  period!: string;

  @Prop({ required: true })
  predictedAmount!: number;

  @Prop({ required: true })
  confidence!: number;

  @Prop({ required: true })
  generatedAt!: Date;
}

export type ForecastDocument = HydratedDocument<ForecastModel>;
export const ForecastSchema = SchemaFactory.createForClass(ForecastModel);
