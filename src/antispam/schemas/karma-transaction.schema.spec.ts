import { KarmaTransactionSchema } from './karma-transaction.schema';

describe('KarmaTransactionSchema', () => {
  it('sets base schema options', () => {
    const options = (
      KarmaTransactionSchema as unknown as {
        options: { timestamps?: boolean; versionKey?: boolean };
      }
    ).options;

    expect(options.timestamps).toBe(true);
    expect(options.versionKey).toBe(false);
  });

  it('defines required ObjectId fields', () => {
    const sourcePath = KarmaTransactionSchema.path('sourceUserId');
    const targetPath = KarmaTransactionSchema.path('targetUserId');
    const groupPath = KarmaTransactionSchema.path('groupId');

    expect(['ObjectID', 'Mixed']).toContain(sourcePath.instance);
    expect(sourcePath.options.required).toBe(true);
    expect(['ObjectID', 'Mixed']).toContain(targetPath.instance);
    expect(targetPath.options.required).toBe(true);
    expect(['ObjectID', 'Mixed']).toContain(groupPath.instance);
    expect(groupPath.options.required).toBe(true);
  });

  it('defines type and ttl for timestamp', () => {
    const timestampPath = KarmaTransactionSchema.path('timestamp');

    expect(timestampPath.instance).toBe('Date');
    expect(timestampPath.options.default).toBeDefined();
    expect(timestampPath.options.expires).toBe('30d');
  });

  it('enforces allowed type values', () => {
    const typePath = KarmaTransactionSchema.path('type');
    expect(typePath.options.enum).toEqual(['KARMA', 'HATE']);
    expect(typePath.options.required).toBe(true);
  });

  it('applies the defined indexes', () => {
    const indexes = KarmaTransactionSchema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ sourceUserId: 1, timestamp: -1 }, expect.any(Object)],
        [
          { sourceUserId: 1, targetUserId: 1, timestamp: -1 },
          expect.any(Object),
        ],
      ]),
    );
  });
});
