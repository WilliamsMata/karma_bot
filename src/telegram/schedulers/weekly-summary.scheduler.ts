import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { KarmaService } from '../../karma/karma.service';
import {
  GroupSettingsService,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  SupportedLanguage,
} from '../../groups/group-settings.service';
import { GroupsService } from '../../groups/groups.service';
import { TelegramService } from '../telegram.service';
import {
  buildWeeklySummaryEmptyMessage,
  buildWeeklySummaryMessage,
  WeeklySummaryEntry,
} from '../dictionary/weekly-summary.dictionary';
import { formatUsernameForDisplay } from '../commands/command.helpers';
import { TopReceivedKarmaDto } from '../../karma/dto/top-received-karma.dto';

@Injectable()
export class WeeklySummaryScheduler {
  private readonly logger = new Logger(WeeklySummaryScheduler.name);

  constructor(
    private readonly groupSettingsService: GroupSettingsService,
    private readonly groupsService: GroupsService,
    private readonly karmaService: KarmaService,
    private readonly telegramService: TelegramService,
  ) {}

  @Cron('0 59 23 * * 0', { name: 'weekly-summary' })
  async handleWeeklySummary(): Promise<void> {
    const groupsWithSummary =
      await this.groupSettingsService.findAllWithWeeklySummaryEnabled();
    if (groupsWithSummary.length === 0) {
      this.logger.debug(
        'No groups are currently opted in for the weekly summary.',
      );
      return;
    }

    for (const groupSetting of groupsWithSummary) {
      const chatId = groupSetting.groupId;

      try {
        const group = await this.groupsService.getGroupInfo(chatId);
        if (!group) {
          this.logger.debug(
            `Skipping weekly summary for unknown group ${chatId}`,
          );
          continue;
        }

        const language = this.resolveLanguage(groupSetting.language);
        const topUsers = await this.karmaService.getTopUsersByKarmaReceived({
          groupId: chatId,
          daysBack: 7,
          limit: 10,
        });

        const message = this.buildMessage(language, topUsers);
        await this.telegramService.sendMessage(chatId, message);
      } catch (error) {
        this.logger.error(
          `Failed to deliver weekly summary for group ${chatId}`,
          error,
        );
      }
    }
  }

  private buildMessage(
    language: SupportedLanguage,
    topUsers: TopReceivedKarmaDto[],
  ): string {
    if (topUsers.length === 0) {
      return buildWeeklySummaryEmptyMessage(language);
    }

    const entries: WeeklySummaryEntry[] = topUsers.map((user, index) => ({
      position: index + 1,
      name: formatUsernameForDisplay({
        firstName: user.firstName,
        userName: user.userName,
      }),
      karma: user.totalKarmaReceived ?? 0,
    }));

    return buildWeeklySummaryMessage(language, entries);
  }

  private resolveLanguage(language?: string): SupportedLanguage {
    if (!language) {
      return DEFAULT_LANGUAGE;
    }

    const candidate = language as SupportedLanguage;
    if (SUPPORTED_LANGUAGES.includes(candidate)) {
      return candidate;
    }

    return DEFAULT_LANGUAGE;
  }
}
