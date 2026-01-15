import { SchemaTypes } from 'mongoose';
import { AbstractDocument } from './abstract.schema';
import { SchemaFactory } from '@nestjs/mongoose';

describe('AbstractDocument schema', () => {
  const schema = SchemaFactory.createForClass(AbstractDocument);

  it('should define _id as ObjectId', () => {
    const idPath = schema.path('_id');

    expect(idPath?.instance).toBe('ObjectId');
    expect(idPath?.options.type).toBe(SchemaTypes.ObjectId);
  });
});
