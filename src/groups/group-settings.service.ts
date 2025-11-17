import { Injectable } from '@nestjs/common';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { GroupSettings } from './schemas/group-settings.schema';
import { GroupSettingsRepository } from './group-settings.repository';

export const DEFAULT_COOLDOWN_SECONDS = 60;
export const SUPPORTED_LANGUAGES = ['en', 'es', 'ru', 'fa'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const DEFAULT_WEEKLY_SUMMARY_ENABLED = true;

@Injectable()
export class GroupSettingsService {
  constructor(
    private readonly groupSettingsRepository: GroupSettingsRepository,
  ) {}

  async ensureDefaults(groupId: number): Promise<GroupSettings> {
    const existing =
      await this.groupSettingsRepository.findOneByGroupId(groupId);
    if (existing) {
      if (typeof existing.weeklySummaryEnabled === 'undefined') {
        return this.groupSettingsRepository.upsert(
          { groupId },
          {
            $set: { weeklySummaryEnabled: DEFAULT_WEEKLY_SUMMARY_ENABLED },
            $setOnInsert: { groupId },
          },
        );
      }

      return existing;
    }

    const filterQuery: FilterQuery<GroupSettings> = { groupId };
    const updateQuery: UpdateQuery<GroupSettings> = {
      $setOnInsert: {
        groupId,
        cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
        language: DEFAULT_LANGUAGE,
        weeklySummaryEnabled: DEFAULT_WEEKLY_SUMMARY_ENABLED,
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

  async isWeeklySummaryEnabled(groupId: number): Promise<boolean> {
    const settings =
      await this.groupSettingsRepository.findOneByGroupId(groupId);
    return settings?.weeklySummaryEnabled ?? DEFAULT_WEEKLY_SUMMARY_ENABLED;
  }

  async updateCooldownSeconds(
    groupId: number,
    cooldownSeconds: number,
  ): Promise<GroupSettings> {
    const filterQuery: FilterQuery<GroupSettings> = { groupId };
    const updateQuery: UpdateQuery<GroupSettings> = {
      $set: { cooldownSeconds },
      $setOnInsert: {
        groupId,
        language: DEFAULT_LANGUAGE,
        weeklySummaryEnabled: DEFAULT_WEEKLY_SUMMARY_ENABLED,
      },
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
      $setOnInsert: {
        groupId,
        cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
        weeklySummaryEnabled: DEFAULT_WEEKLY_SUMMARY_ENABLED,
      },
    };

    return this.groupSettingsRepository.upsert(filterQuery, updateQuery);
  }

  async updateWeeklySummaryEnabled(
    groupId: number,
    enabled: boolean,
  ): Promise<GroupSettings> {
    const filterQuery: FilterQuery<GroupSettings> = { groupId };
    const updateQuery: UpdateQuery<GroupSettings> = {
      $set: { weeklySummaryEnabled: enabled },
      $setOnInsert: {
        groupId,
        cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
        language: DEFAULT_LANGUAGE,
        weeklySummaryEnabled: DEFAULT_WEEKLY_SUMMARY_ENABLED,
      },
    };

    return this.groupSettingsRepository.upsert(filterQuery, updateQuery);
  }

  findAllWithWeeklySummaryEnabled(): Promise<GroupSettings[]> {
    return this.groupSettingsRepository.findAllWithWeeklySummaryEnabled();
  }
}
