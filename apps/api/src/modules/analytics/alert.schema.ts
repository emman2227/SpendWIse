import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { AlertSeverity, AlertStatus, AlertType } from '@spendwise/shared';
import type { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'alerts',
  timestamps: true,
  versionKey: false,
})
export class AlertModel {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, default: 'anomaly' })
  type!: AlertType;

  @Prop({ required: true, default: 'warning' })
  severity!: AlertSeverity;

  @Prop({ required: true, default: 'pending', index: true })
  status!: AlertStatus;

  @Prop({ required: true })
  merchant!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: false })
  categoryId?: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  date!: string;

  @Prop({ required: true })
  reason!: string;

  @Prop({ required: true })
  suggestedAction!: string;

  @Prop({ type: Object, required: false })
  evidence?: Record<string, unknown>;

  @Prop({ required: false, index: true })
  transactionId?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type AlertDocument = HydratedDocument<AlertModel>;
export const AlertSchema = SchemaFactory.createForClass(AlertModel);
