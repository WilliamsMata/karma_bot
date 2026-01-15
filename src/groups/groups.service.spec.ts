import { GroupsService } from './groups.service';
import { GroupsRepository } from './groups.repository';
import { Group } from './schemas/group.schema';
import type { ITelegramChat } from '../telegram/telegram.interfaces';
import {
  GroupSettingsService,
  SupportedLanguage,
} from './group-settings.service';
import { GroupSettings } from './schemas/group-settings.schema';
import { Types } from 'mongoose';

describe('GroupsService', () => {
  const group: Group = {
    _id: new Types.ObjectId(),
    groupId: 123,
    groupName: 'Chat',
  } as Group;

  const settings: GroupSettings = {
    _id: new Types.ObjectId(),
    groupId: 123,
    cooldownSeconds: 60,
    language: 'en',
  } as GroupSettings;

  const repo = {
    findOrCreate: jest.fn(),
    findPublicByIds: jest.fn(),
    findOneByGroupId: jest.fn(),
    findAll: jest.fn(),
    countDocuments: jest.fn(),
    findByIds: jest.fn(),
  } satisfies {
    findOrCreate: jest.MockedFunction<
      (chat: ITelegramChat) => Promise<Group | null>
    >;
    findPublicByIds: jest.MockedFunction<
      (ids: Types.ObjectId[]) => Promise<Group[]>
    >;
    findOneByGroupId: jest.MockedFunction<
      (groupId: number) => Promise<Group | null>
    >;
    findAll: jest.MockedFunction<() => Promise<Group[]>>;
    countDocuments: jest.MockedFunction<() => Promise<number>>;
    findByIds: jest.MockedFunction<(ids: Types.ObjectId[]) => Promise<Group[]>>;
  };

  const settingsService = {
    ensureDefaults: jest.fn(),
    getLanguage: jest.fn(),
    updateLanguage: jest.fn(),
  } satisfies {
    ensureDefaults: jest.MockedFunction<
      (groupId: number) => Promise<GroupSettings>
    >;
    getLanguage: jest.MockedFunction<
      (groupId: number) => Promise<SupportedLanguage>
    >;
    updateLanguage: jest.MockedFunction<
      (groupId: number, lang: SupportedLanguage) => Promise<GroupSettings>
    >;
  };

  let service: GroupsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GroupsService(
      repo as unknown as GroupsRepository,
      settingsService as unknown as GroupSettingsService,
    );
  });

  describe('findOrCreate', () => {
    it('finds or creates and ensures defaults', async () => {
      const chat: ITelegramChat = { id: 1, title: 'c' };
      repo.findOrCreate.mockResolvedValue(group);
      settingsService.ensureDefaults.mockResolvedValue(settings);

      const result = await service.findOrCreate(chat);

      expect(repo.findOrCreate).toHaveBeenCalledWith(chat);
      expect(settingsService.ensureDefaults).toHaveBeenCalledWith(
        group.groupId,
      );
      expect(result).toBe(group);
    });

    it('throws when repository returns null', async () => {
      const chat: ITelegramChat = { id: 1, title: 'c' };
      repo.findOrCreate.mockResolvedValue(null);

      await expect(service.findOrCreate(chat)).rejects.toThrow(
        'Could not find or create group 1',
      );
    });
  });

  describe('findPublicGroupsByIds', () => {
    it('filters groups with groupId length >= 13', async () => {
      const ids = [new Types.ObjectId(), new Types.ObjectId()];
      const groups = [
        { ...group, groupId: 1234567890123 },
        { ...group, groupId: 123 },
      ] as Group[];
      repo.findPublicByIds.mockResolvedValue(groups);

      const result = await service.findPublicGroupsByIds(ids);

      expect(repo.findPublicByIds).toHaveBeenCalledWith(ids);
      expect(result).toEqual([groups[0]]);
    });
  });

  describe('getGroupInfo', () => {
    it('returns group and ensures defaults when found', async () => {
      repo.findOneByGroupId.mockResolvedValue(group);
      settingsService.ensureDefaults.mockResolvedValue(settings);

      await expect(service.getGroupInfo(group.groupId)).resolves.toBe(group);
      expect(settingsService.ensureDefaults).toHaveBeenCalledWith(
        group.groupId,
      );
    });

    it('returns null when not found', async () => {
      repo.findOneByGroupId.mockResolvedValue(null);
      await expect(service.getGroupInfo(9)).resolves.toBeNull();
    });
  });

  describe('getDistinctGroupIds', () => {
    it('returns list of groupIds', async () => {
      repo.findAll.mockResolvedValue([
        group,
        { ...group, groupId: 2 } as Group,
      ]);
      await expect(service.getDistinctGroupIds()).resolves.toEqual([123, 2]);
    });
  });

  describe('count', () => {
    it('returns total count', async () => {
      repo.countDocuments.mockResolvedValue(5);
      await expect(service.count()).resolves.toBe(5);
    });
  });

  describe('findByIds', () => {
    it('delegates to repository', async () => {
      const ids = [new Types.ObjectId()];
      repo.findByIds.mockResolvedValue([group]);
      await expect(service.findByIds(ids)).resolves.toEqual([group]);
      expect(repo.findByIds).toHaveBeenCalledWith(ids);
    });
  });

  describe('getGroupSettings', () => {
    it('returns ensured settings', async () => {
      settingsService.ensureDefaults.mockResolvedValue(settings);
      await expect(service.getGroupSettings(group.groupId)).resolves.toBe(
        settings,
      );
      expect(settingsService.ensureDefaults).toHaveBeenCalledWith(
        group.groupId,
      );
    });
  });

  describe('getGroupLanguage', () => {
    it('delegates to settings service', async () => {
      settingsService.getLanguage.mockResolvedValue('es');
      await expect(service.getGroupLanguage(group.groupId)).resolves.toBe('es');
      expect(settingsService.getLanguage).toHaveBeenCalledWith(group.groupId);
    });
  });

  describe('updateGroupLanguage', () => {
    it('updates language via settings service', async () => {
      const updatedSettings = { ...settings, language: 'ru' } as GroupSettings;
      settingsService.updateLanguage.mockResolvedValue(updatedSettings);

      const result = await service.updateGroupLanguage(group.groupId, 'ru');

      expect(settingsService.updateLanguage).toHaveBeenCalledWith(
        group.groupId,
        'ru',
      );
      expect(result).toBe(updatedSettings);
    });
  });
});
