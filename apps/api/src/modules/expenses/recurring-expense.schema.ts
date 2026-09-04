import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import type { HydratedDocument } from 'mongoose';

export type RecurringExpenseDocument = HydratedDocument<RecurringExpenseModel>;

@Schema({
  collection: 'recurring_expenses',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class RecurringExpenseModel {
  @Prop({
    type: String,
    default: () => crypto.randomUUID(),
  })
  _id!: string;

  @Prop({ type: String, required: true, index: true })
  userId!: string;

  @Prop({ type: Number, required: true })
  amount!: number;

  @Prop({ type: String, required: true })
  categoryId!: string;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: String, required: true })
  cadence!: string; // e.g., 'weekly', 'monthly', 'yearly'

  @Prop({ type: Date, required: true })
  nextDueDate!: Date;

  @Prop({ type: String, default: 'credit_card' })
  paymentMethod!: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: String, required: false })
  notes?: string;

  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export const RecurringExpenseSchema = SchemaFactory.createForClass(RecurringExpenseModel);
