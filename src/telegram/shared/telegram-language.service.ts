import { Injectable, Logger } from '@nestjs/common';
import type { Chat, User } from 'telegraf/types';
import {
  DEFAULT_LANGUAGE,
  GroupSettingsService,
  SupportedLanguage,
} from '../../groups/group-settings.service';

@Injectable()
export class TelegramLanguageService {
  private readonly logger = new Logger(TelegramLanguageService.name);
  private readonly languageAliases: Record<string, SupportedLanguage> = {
    en: 'en',
    es: 'es',
    ru: 'ru',
    fa: 'fa',
  };

  constructor(private readonly groupSettingsService: GroupSettingsService) {}

  async resolveLanguage(chat?: Chat): Promise<SupportedLanguage> {
    if (!chat || typeof chat.id !== 'number') {
      return DEFAULT_LANGUAGE;
    }

    let language: SupportedLanguage = DEFAULT_LANGUAGE;

    try {
      if (chat.type === 'group' || chat.type === 'supergroup') {
        await this.groupSettingsService.ensureDefaults(chat.id);
      }

      language = await this.groupSettingsService.getLanguage(chat.id);
    } catch (error) {
      this.logger.warn(`Failed to resolve language for chat ${chat.id}`, error);
    }

    return language;
  }

  resolveLanguageFromUser(user?: User): SupportedLanguage {
    const languageCode = user?.language_code;
    if (!languageCode) {
      return DEFAULT_LANGUAGE;
    }

    const normalized = languageCode.toLowerCase();
    const [primary] = normalized.split('-');

    return this.languageAliases[primary] ?? DEFAULT_LANGUAGE;
  }
}
