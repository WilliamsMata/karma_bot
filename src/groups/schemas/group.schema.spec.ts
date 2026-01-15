import { SchemaTypes } from 'mongoose';
import { GroupSchema } from './group.schema';

describe('GroupSchema', () => {
  it('should set timestamps and disable versionKey', () => {
    expect(GroupSchema.get('timestamps')).toBe(true);
    expect(GroupSchema.get('versionKey')).toBe(false);
  });

  it('should define groupId as required unique index', () => {
    const path = GroupSchema.path('groupId');
    expect(path?.instance).toBe('Number');
    expect(path?.options.required).toBe(true);
    expect(path?.options.unique).toBe(true);
    expect(path?.options.index).toBe(true);
  });

  it('should define optional groupName with index', () => {
    const path = GroupSchema.path('groupName');
    expect(path?.instance).toBe('String');
    expect(path?.options.index).toBe(true);
    expect(path?.options.required).toBeUndefined();
  });

  it('should keep _id as ObjectId from abstract document', () => {
    const path = GroupSchema.path('_id');
    expect(path?.instance).toBe('ObjectId');
    expect(path?.options.type).toBe(SchemaTypes.ObjectId);
  });
});
