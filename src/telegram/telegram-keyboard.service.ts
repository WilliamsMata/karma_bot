import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Markup } from 'telegraf';
import { InlineKeyboardMarkup, Chat } from 'telegraf/types';

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
  ): Markup.Markup<InlineKeyboardMarkup> | undefined {
    if (chat.type !== 'group' && chat.type !== 'supergroup') {
      return undefined;
    }

    const url = `https://t.me/${this.botUsername}?startapp=chatId${chat.id}`;
    return Markup.inlineKeyboard([Markup.button.url('Open Mini App', url)]);
  }
}
