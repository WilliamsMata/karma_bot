import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../../database/abstract.schema';

@Schema({ timestamps: true, versionKey: false })
export class GroupSettings extends AbstractDocument {
  @Prop({ required: true, unique: true, index: true })
  groupId: number;

  @Prop({ required: true, min: 5, max: 86400, default: 60 })
  cooldownSeconds: number;

  @Prop({ required: true, default: 'en', enum: ['en', 'es', 'ru', 'fa'] })
  language: string;

  @Prop({ default: true })
  weeklySummaryEnabled: boolean;
}

export const GroupSettingsSchema = SchemaFactory.createForClass(GroupSettings);
