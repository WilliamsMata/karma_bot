import { SchemaTypes } from 'mongoose';
import { GroupSettingsSchema } from './group-settings.schema';

describe('GroupSettingsSchema', () => {
  it('should set timestamps and disable versionKey', () => {
    expect(GroupSettingsSchema.get('timestamps')).toBe(true);
    expect(GroupSettingsSchema.get('versionKey')).toBe(false);
  });

  it('should define groupId as required unique index', () => {
    const path = GroupSettingsSchema.path('groupId');
    expect(path?.instance).toBe('Number');
    expect(path?.options.required).toBe(true);
    expect(path?.options.unique).toBe(true);
    expect(path?.options.index).toBe(true);
  });

  it('should enforce cooldownSeconds bounds and default', () => {
    const path = GroupSettingsSchema.path('cooldownSeconds');
    expect(path?.instance).toBe('Number');
    expect(path?.options.required).toBe(true);
    expect(path?.options.min).toBe(5);
    expect(path?.options.max).toBe(86400);
    expect(path?.options.default).toBe(60);
  });

  it('should define language enum with default', () => {
    const path = GroupSettingsSchema.path('language');
    expect(path?.instance).toBe('String');
    expect(path?.options.required).toBe(true);
    expect(path?.options.default).toBe('en');
    expect(path?.options.enum).toEqual(['en', 'es', 'ru', 'fa']);
  });

  it('should keep _id as ObjectId from abstract document', () => {
    const path = GroupSettingsSchema.path('_id');
    expect(path?.instance).toBe('ObjectId');
    expect(path?.options.type).toBe(SchemaTypes.ObjectId);
  });
});
