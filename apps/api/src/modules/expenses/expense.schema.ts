import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'expenses',
  timestamps: true,
  versionKey: false
})
export class ExpenseModel {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  categoryId!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true })
  paymentMethod!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop()
  notes?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ExpenseDocument = HydratedDocument<ExpenseModel>;
export const ExpenseSchema = SchemaFactory.createForClass(ExpenseModel);
