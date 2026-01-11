import { Injectable } from '@nestjs/common';
import {
  formatKarmaHistory,
  formatUsernameForDisplay,
} from '../command.helpers';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  buildGetHistoryErrorMessage,
  buildGetHistorySuccessMessage,
  buildGetHistoryUsageMessage,
} from '../../dictionary/get-history.dictionary';
import { BaseKarmaCommandHandler } from './base.karma.command.handler';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';

@Injectable()
export class GetHistoryCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  command = /^\/gethistory(?:@\w+)?(?:\s+(.*))?$/;

  async execute(ctx: TextCommandContext): Promise<void> {
    const language = ctx.language;

    const match = ctx.message.text.match(this.command);
    const input = match?.[1]?.trim();

    if (!input) {
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildGetHistoryUsageMessage(language),
      );
      return;
    }

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
