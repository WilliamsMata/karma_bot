import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../../database/abstract.schema';

@Schema({ timestamps: true, versionKey: false })
export class Group extends AbstractDocument {
  @Prop({ required: true, unique: true, index: true })
  groupId: number;

  @Prop({ index: true })
  groupName?: string;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
