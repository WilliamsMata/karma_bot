import { SchemaTypes } from 'mongoose';
import { UserSchema } from './user.schema';

describe('UserSchema', () => {
  it('should enable timestamps and disable versionKey', () => {
    expect(UserSchema.get('timestamps')).toBe(true);
    expect(UserSchema.get('versionKey')).toBe(false);
  });

  it('should define userId as required and unique number', () => {
    const userIdPath = UserSchema.path('userId');

    expect(userIdPath?.instance).toBe('Number');
    expect(userIdPath?.options.required).toBe(true);
    expect(userIdPath?.options.unique).toBe(true);
  });

  it('should index userName without requiring it', () => {
    const userNamePath = UserSchema.path('userName');

    expect(userNamePath?.instance).toBe('String');
    expect(userNamePath?.options.index).toBe(true);
    expect(userNamePath?.options.required).toBeUndefined();
  });

  it('should require firstName and allow optional lastName', () => {
    const firstNamePath = UserSchema.path('firstName');
    const lastNamePath = UserSchema.path('lastName');

    expect(firstNamePath?.instance).toBe('String');
    expect(firstNamePath?.options.required).toBe(true);
    expect(lastNamePath?.instance).toBe('String');
    expect(lastNamePath?.options.required).toBeUndefined();
  });

  it('should include bannedUntil as an optional date', () => {
    const bannedUntilPath = UserSchema.path('bannedUntil');

    expect(bannedUntilPath?.instance).toBe('Date');
    expect(bannedUntilPath?.options.required).toBeUndefined();
  });

  it('should keep _id as an ObjectId from the abstract document', () => {
    const idPath = UserSchema.path('_id');

    expect(idPath?.instance).toBe('ObjectId');
    expect(idPath?.options.type).toBe(SchemaTypes.ObjectId);
  });
});
