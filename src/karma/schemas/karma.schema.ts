import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AbstractDocument } from '../../database/abstract.schema';
import { User } from '../../users/schemas/user.schema';
import { Group } from '../../groups/schemas/group.schema';

@Schema({ _id: false })
export class KarmaHistory {
  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ required: true })
  karmaChange: number;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  actor: Types.ObjectId;

  @Prop({ required: true })
  actorFirstName: string;

  @Prop()
  actorLastName?: string;

  @Prop()
  actorUserName?: string;

  @Prop({ required: true })
  actorTelegramId: number;

  @Prop()
  targetFirstName?: string;

  @Prop()
  targetLastName?: string;

  @Prop()
  targetUserName?: string;

  @Prop()
  targetTelegramId?: number;

  @Prop()
  messageId?: number;

  @Prop()
  chatId?: number;
}

@Schema({ timestamps: true, versionKey: false })
export class Karma extends AbstractDocument {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Group.name, required: true })
  group: Types.ObjectId;

  @Prop({ default: 0 })
  karma: number;

  @Prop({ type: [KarmaHistory], default: [] })
  history: KarmaHistory[];

  @Prop({ default: 0 })
  givenKarma: number;

  @Prop({ default: 0 })
  givenHate: number;
}

export const KarmaSchema = SchemaFactory.createForClass(Karma);

KarmaSchema.index({ user: 1, group: 1 }, { unique: true });
KarmaSchema.index({ group: 1, karma: -1 });
KarmaSchema.index({ group: 1, karma: 1 });
KarmaSchema.index({ group: 1, givenKarma: -1 });
KarmaSchema.index({ group: 1, givenHate: -1 });
