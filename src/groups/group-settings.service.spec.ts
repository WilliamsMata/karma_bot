import {
  GroupSettingsService,
  DEFAULT_COOLDOWN_SECONDS,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from './group-settings.service';
import { GroupSettings } from './schemas/group-settings.schema';
import { Types } from 'mongoose';
import { GroupSettingsRepository } from './group-settings.repository';

describe('GroupSettingsService', () => {
  const settings: GroupSettings = {
    _id: new Types.ObjectId(),
    groupId: 1,
    cooldownSeconds: 30,
    language: 'es',
  } as GroupSettings;

  const repo = {
    findOneByGroupId: jest.fn(),
    upsert: jest.fn(),
  } satisfies {
    findOneByGroupId: jest.MockedFunction<
      (groupId: number) => Promise<GroupSettings | null>
    >;
    upsert: jest.MockedFunction<
      (filter: unknown, update: unknown) => Promise<GroupSettings>
    >;
  };

  let service: GroupSettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GroupSettingsService(
      repo as unknown as GroupSettingsRepository,
    );
  });

  describe('ensureDefaults', () => {
    it('returns existing settings when present', async () => {
      repo.findOneByGroupId.mockResolvedValue(settings);

      await expect(service.ensureDefaults(settings.groupId)).resolves.toBe(
        settings,
      );
      expect(repo.upsert).not.toHaveBeenCalled();
    });

    it('creates defaults when missing', async () => {
      const created = {
        ...settings,
        cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
        language: DEFAULT_LANGUAGE,
      };
      repo.findOneByGroupId.mockResolvedValue(null);
      repo.upsert.mockResolvedValue(created as GroupSettings);

      const result = await service.ensureDefaults(settings.groupId);

      expect(repo.upsert).toHaveBeenCalledWith(
        { groupId: settings.groupId },
        {
          $setOnInsert: {
            groupId: settings.groupId,
            cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
            language: DEFAULT_LANGUAGE,
          },
        },
      );
      expect(result).toBe(created);
    });
  });

  describe('getCooldownSeconds', () => {
    it('returns stored cooldown', async () => {
      repo.findOneByGroupId.mockResolvedValue(settings);
      await expect(service.getCooldownSeconds(1)).resolves.toBe(30);
    });

    it('returns default when missing', async () => {
      repo.findOneByGroupId.mockResolvedValue(null);
      await expect(service.getCooldownSeconds(1)).resolves.toBe(
        DEFAULT_COOLDOWN_SECONDS,
      );
    });
  });

  describe('getLanguage', () => {
    it('returns stored supported language', async () => {
      repo.findOneByGroupId.mockResolvedValue(settings);
      await expect(service.getLanguage(1)).resolves.toBe('es');
    });

    it('returns default when missing', async () => {
      repo.findOneByGroupId.mockResolvedValue(null);
      await expect(service.getLanguage(1)).resolves.toBe(DEFAULT_LANGUAGE);
    });

    it('falls back to default when unsupported stored language', async () => {
      repo.findOneByGroupId.mockResolvedValue({
        ...settings,
        language: 'xx',
      } as GroupSettings);
      await expect(service.getLanguage(1)).resolves.toBe(DEFAULT_LANGUAGE);
    });
  });

  describe('updateCooldownSeconds', () => {
    it('upserts cooldown and returns result', async () => {
      const updated = { ...settings, cooldownSeconds: 99 } as GroupSettings;
      repo.upsert.mockResolvedValue(updated);

      const result = await service.updateCooldownSeconds(1, 99);

      expect(repo.upsert).toHaveBeenCalledWith(
        { groupId: 1 },
        { $set: { cooldownSeconds: 99 }, $setOnInsert: { groupId: 1 } },
      );
      expect(result).toBe(updated);
    });
  });

  describe('updateLanguage', () => {
    it('throws on unsupported language', async () => {
      await expect(
        service.updateLanguage(1, 'xx' as unknown as SupportedLanguage),
      ).rejects.toThrow('Unsupported language: xx');
      expect(repo.upsert).not.toHaveBeenCalled();
    });

    it('updates supported language', async () => {
      const updated = { ...settings, language: 'ru' } as GroupSettings;
      repo.upsert.mockResolvedValue(updated);

      const result = await service.updateLanguage(1, 'ru');

      expect(repo.upsert).toHaveBeenCalledWith(
        { groupId: 1 },
        { $set: { language: 'ru' }, $setOnInsert: { groupId: 1 } },
      );
      expect(result).toBe(updated);
    });
  });
});
