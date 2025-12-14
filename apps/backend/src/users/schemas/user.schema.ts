import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['google', 'apple'] })
  authProvider: string;

  @Prop({ required: true })
  authProviderId: string;

  @Prop({ required: true })
  timezone: string;

  @Prop({ default: 9 })
  workStartHour: number;

  @Prop({ default: 17 })
  workEndHour: number;

  @Prop()
  googleCalendarRefreshToken?: string;

  @Prop({ default: false })
  appleCalendarEnabled: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
