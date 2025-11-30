import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GroupDocument = HydratedDocument<Group>;

@Schema()
export class GroupMember {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, default: () => new Date() })
  joinedAt: Date;

  @Prop({ default: false })
  hasConfirmedAvailability: boolean;
}

@Schema()
export class Vote {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['yes', 'no', 'maybe'] })
  vote: string;
}

@Schema()
export class ProposedTime {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string; // e.g., "18:00"

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  availableMembers: Types.ObjectId[];

  @Prop({ type: [Vote], default: [] })
  votes: Vote[];
}

@Schema({ timestamps: true })
export class Group {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: [GroupMember], default: [] })
  members: GroupMember[];

  @Prop({ default: 6 })
  maxMembers: number;

  @Prop({ type: [ProposedTime], default: [] })
  proposedTimes: ProposedTime[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
