import { Injectable } from '@nestjs/common';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { GroupSettings } from './schemas/group-settings.schema';
import { GroupSettingsRepository } from './group-settings.repository';

const DEFAULT_COOLDOWN_SECONDS = 60;
export const SUPPORTED_LANGUAGES = ['en', 'es', 'ru', 'fa'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

@Injectable()
export class GroupSettingsService {
  constructor(
    private readonly groupSettingsRepository: GroupSettingsRepository,
  ) {}

  async ensureDefaults(groupId: number): Promise<GroupSettings> {
    const existing =
      await this.groupSettingsRepository.findOneByGroupId(groupId);
    if (existing) {
      return existing;
    }

    const filterQuery: FilterQuery<GroupSettings> = { groupId };
    const updateQuery: UpdateQuery<GroupSettings> = {
      $setOnInsert: {
        groupId,
        cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
        language: DEFAULT_LANGUAGE,
      },
    };

    return this.groupSettingsRepository.upsert(filterQuery, updateQuery);
  }

  async getCooldownSeconds(groupId: number): Promise<number> {
    const settings =
      await this.groupSettingsRepository.findOneByGroupId(groupId);
    return settings?.cooldownSeconds ?? DEFAULT_COOLDOWN_SECONDS;
  }

  async getLanguage(groupId: number): Promise<SupportedLanguage> {
    const settings =
      await this.groupSettingsRepository.findOneByGroupId(groupId);
    const language = settings?.language ?? DEFAULT_LANGUAGE;
    return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)
      ? (language as SupportedLanguage)
      : DEFAULT_LANGUAGE;
  }

  async updateCooldownSeconds(
    groupId: number,
    cooldownSeconds: number,
  ): Promise<GroupSettings> {
    const filterQuery: FilterQuery<GroupSettings> = { groupId };
    const updateQuery: UpdateQuery<GroupSettings> = {
      $set: { cooldownSeconds },
      $setOnInsert: { groupId },
    };

    return this.groupSettingsRepository.upsert(filterQuery, updateQuery);
  }

  async updateLanguage(
    groupId: number,
    language: SupportedLanguage,
  ): Promise<GroupSettings> {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const filterQuery: FilterQuery<GroupSettings> = { groupId };
    const updateQuery: UpdateQuery<GroupSettings> = {
      $set: { language },
      $setOnInsert: { groupId },
    };

    return this.groupSettingsRepository.upsert(filterQuery, updateQuery);
  }
}
