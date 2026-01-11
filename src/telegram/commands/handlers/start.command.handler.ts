import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Markup } from 'telegraf';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import {
  buildStartBotNotConfiguredMessage,
  buildStartButtonLabel,
  buildStartMessage,
} from '../../dictionary/start.dictionary';
import { BaseKarmaCommandHandler } from './base.karma.command.handler';

@Injectable()
export class StartCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  command = 'start';
  private readonly logger = new Logger(StartCommandHandler.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  handle(ctx: TextCommandContext): Promise<void> {
    const language = this.languageService.resolveLanguageFromUser(ctx.from);
    const botUsernameFromEnv = this.configService.get<string>(
      'TELEGRAM_BOT_USERNAME',
    );

    if (!botUsernameFromEnv) {
      this.logger.error('TELEGRAM_BOT_USERNAME is not configured.');
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildStartBotNotConfiguredMessage(language),
      );
      return Promise.resolve();
    }

    const botUsername = botUsernameFromEnv.replace(/^@/, '');
    const addToGroupUrl = `https://t.me/${botUsername}?startgroup=true`;
    const message = buildStartMessage(language);
    const buttonLabel = buildStartButtonLabel(language);

    const extra: ExtraReplyMessage = {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        Markup.button.url(buttonLabel, addToGroupUrl),
      ]).reply_markup,
    };

    this.messageQueueService.addMessage(ctx.chat.id, message, extra);
    return Promise.resolve();
  }
}
