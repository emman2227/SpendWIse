import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'users',
  timestamps: true,
  versionKey: false,
})
export class UserModel {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ default: false })
  emailVerified!: boolean;

  @Prop()
  emailVerifiedAt?: Date;

  @Prop()
  emailVerificationCodeHash?: string;

  @Prop()
  emailVerificationCodeExpiresAt?: Date;

  @Prop()
  emailVerificationSentAt?: Date;

  @Prop()
  passwordResetCodeHash?: string;

  @Prop()
  passwordResetCodeExpiresAt?: Date;

  @Prop()
  passwordResetSentAt?: Date;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop()
  refreshTokenHash?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = HydratedDocument<UserModel>;
export const UserSchema = SchemaFactory.createForClass(UserModel);
