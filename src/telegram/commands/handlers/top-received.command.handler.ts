import { Injectable, Logger } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { formatUsernameForDisplay } from '../command.helpers';
import { TelegramLanguageService } from '../../shared/telegram-language.service';
import {
  TopReceivedPeriod,
  buildTopReceivedEmptyMessage,
  buildTopReceivedErrorMessage,
  buildTopReceivedMessage,
} from '../../dictionary/top-received.dictionary';
import { MessageQueueService } from '../../shared/message-queue.service';

@Injectable()
export class TopReceivedCommandHandler implements ITextCommandHandler {
  private readonly logger = new Logger(TopReceivedCommandHandler.name);
  command = /^\/(today|month|year)/;

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly languageService: TelegramLanguageService,
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const match = ctx.message.text.match(this.command);
    if (!match) return;

    const commandName = match[1] as TopReceivedPeriod;
    let daysBack: number;

    switch (commandName) {
      case 'today':
        daysBack = 1;
        break;
      case 'month':
        daysBack = 30;
        break;
      case 'year':
        daysBack = 365;
        break;
      default:
        return;
    }

    const language = await this.languageService.resolveLanguage(ctx.chat);

    try {
      const topUsers = await this.karmaService.getTopUsersByKarmaReceived({
        groupId: ctx.chat.id,
        daysBack,
        limit: 10,
      });
      const keyboard = this.keyboardService.getGroupWebAppKeyboard(
        ctx.chat,
        language,
      );

      const extra: ExtraReplyMessage = {};
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }

      if (topUsers.length === 0) {
        this.messageQueueService.addMessage(
          ctx.chat.id,
          buildTopReceivedEmptyMessage(language, commandName),
          extra,
        );
        return;
      }

      const entries = topUsers.map((user, index) => ({
        position: index + 1,
        name: formatUsernameForDisplay(user),
        karma: user.totalKarmaReceived ?? 0,
      }));

      const message = buildTopReceivedMessage(language, commandName, entries);
      this.messageQueueService.addMessage(ctx.chat.id, message, extra);
    } catch (error) {
      this.logger.error(`Error handling /${commandName}`, error);
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildTopReceivedErrorMessage(language, commandName),
      );
    }
  }
}
