import { KarmaSchema } from './karma.schema';

describe('KarmaSchema', () => {
  it('sets base schema options', () => {
    const options = (
      KarmaSchema as unknown as {
        options: { timestamps?: boolean; versionKey?: boolean };
      }
    ).options;

    expect(options.timestamps).toBe(true);
    expect(options.versionKey).toBe(false);
  });

  it('defines indexes', () => {
    const indexes = KarmaSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ user: 1, group: 1 }, expect.any(Object)],
        [{ group: 1, karma: -1 }, expect.any(Object)],
        [{ group: 1, karma: 1 }, expect.any(Object)],
        [{ group: 1, givenKarma: -1 }, expect.any(Object)],
        [{ group: 1, givenHate: -1 }, expect.any(Object)],
      ]),
    );
  });
});
