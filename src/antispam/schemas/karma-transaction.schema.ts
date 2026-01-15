import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AbstractDocument } from '../../database/abstract.schema';

@Schema({ timestamps: true, versionKey: false })
export class KarmaTransaction extends AbstractDocument {
  @Prop({ type: Types.ObjectId, required: true })
  sourceUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  targetUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  groupId: Types.ObjectId;

  @Prop({ required: true, enum: ['KARMA', 'HATE'] })
  type: string;

  @Prop({ default: Date.now, expires: '30d' })
  timestamp?: Date;
}

export const KarmaTransactionSchema =
  SchemaFactory.createForClass(KarmaTransaction);

KarmaTransactionSchema.index({ sourceUserId: 1, timestamp: -1 });
KarmaTransactionSchema.index({
  sourceUserId: 1,
  targetUserId: 1,
  timestamp: -1,
});
