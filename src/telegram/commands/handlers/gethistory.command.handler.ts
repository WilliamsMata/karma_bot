import { Injectable, Logger } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import {
  formatKarmaHistory,
  formatUsernameForDisplay,
} from '../command.helpers';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  buildGetHistoryErrorMessage,
  buildGetHistorySuccessMessage,
  buildGetHistoryUsageMessage,
} from '../../dictionary/get-history.dictionary';
import { TelegramLanguageService } from '../../shared/telegram-language.service';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { MessageQueueService } from '../../shared/message-queue.service';

@Injectable()
export class GetHistoryCommandHandler implements ITextCommandHandler {
  private readonly logger = new Logger(GetHistoryCommandHandler.name);
  command = /^\/gethistory(?:@\w+)?\s+(.+)$/;

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly languageService: TelegramLanguageService,
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const language = await this.languageService.resolveLanguage(ctx.chat);

    const match = ctx.message.text.match(this.command);
    if (!match) {
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildGetHistoryUsageMessage(language),
      );
      return;
    }

    const input = match[1].trim();
    try {
      const karma = await this.karmaService.findKarmaByUserQuery({
        input,
        groupId: ctx.chat.id,
      });
      const keyboard = this.keyboardService.getGroupWebAppKeyboard(
        ctx.chat,
        language,
      );
      const extra: ExtraReplyMessage = {};
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }
      const historyMessage = formatKarmaHistory(karma?.history, {
        language,
        currentUserTelegramId: karma?.user?.userId ?? ctx.from.id,
        useSelfPronoun: false,
        selfDisplayName: karma?.user
          ? formatUsernameForDisplay(karma.user)
          : undefined,
      });

      const message = buildGetHistorySuccessMessage(language, {
        input,
        historyMessage,
      });

      this.messageQueueService.addMessage(ctx.chat.id, message, extra);
    } catch (error) {
      this.logger.error(
        `Error handling /gethistory for input "${input}"`,
        error,
      );
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildGetHistoryErrorMessage(language, { input }),
      );
    }
  }
}
