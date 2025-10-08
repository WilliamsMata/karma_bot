import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Markup } from 'telegraf';
import { InlineKeyboardMarkup, Chat } from 'telegraf/types';
import {
  DEFAULT_LANGUAGE,
  SupportedLanguage,
} from '../../groups/group-settings.service';
import { buildTelegramKeyboardOpenMiniAppButtonLabel } from '../dictionary/telegram-keyboard.dictionary';

@Injectable()
export class TelegramKeyboardService {
  private readonly logger = new Logger(TelegramKeyboardService.name);
  private readonly botUsername: string;

  constructor(private readonly configService: ConfigService) {
    this.botUsername = this.configService
      .get<string>('TELEGRAM_BOT_USERNAME')!
      .replace(/^@/, '');
    this.logger.log(
      `WebApp Keyboard Service initialized for bot: @${this.botUsername}`,
    );
  }

  getGroupWebAppKeyboard(
    chat: Chat,
    language: SupportedLanguage = DEFAULT_LANGUAGE,
  ): Markup.Markup<InlineKeyboardMarkup> | undefined {
    if (chat.type !== 'group' && chat.type !== 'supergroup') {
      return undefined;
    }

    const url = `https://t.me/${this.botUsername}?startapp=chatId${chat.id}`;
    const buttonLabel = buildTelegramKeyboardOpenMiniAppButtonLabel(language);

    return Markup.inlineKeyboard([Markup.button.url(buttonLabel, url)]);
  }
}
