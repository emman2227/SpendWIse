import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'categories',
  timestamps: true,
  versionKey: false
})
export class CategoryModel {
  @Prop()
  userId?: string;

  @Prop({ default: false })
  isSystemDefined!: boolean;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  icon!: string;

  @Prop({ required: true, trim: true })
  color!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type CategoryDocument = HydratedDocument<CategoryModel>;
export const CategorySchema = SchemaFactory.createForClass(CategoryModel);
