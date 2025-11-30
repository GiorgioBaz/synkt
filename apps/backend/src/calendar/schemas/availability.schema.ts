import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AvailabilityDocument = HydratedDocument<Availability>;

@Schema()
export class TimeBlock {
  @Prop({ required: true })
  start: Date;

  @Prop({ required: true })
  end: Date;
}

@Schema({ timestamps: true })
export class Availability {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: [TimeBlock], default: [] })
  busyBlocks: TimeBlock[];

  @Prop({ required: true })
  lastSyncedAt: Date;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);

// Create compound index for efficient queries
AvailabilitySchema.index({ userId: 1, date: 1 }, { unique: true });
