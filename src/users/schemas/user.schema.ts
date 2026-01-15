import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../../database/abstract.schema';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User extends AbstractDocument {
  @Prop({ required: true, unique: true })
  userId: number;

  @Prop({ index: true })
  userName?: string;

  @Prop({ required: true })
  firstName: string;

  @Prop()
  lastName?: string;

  @Prop()
  bannedUntil?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
