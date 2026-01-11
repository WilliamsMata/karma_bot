import { Injectable } from '@nestjs/common';
import { formatKarmaHistory } from '../command.helpers';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import {
  buildHistoryEmptyMessage,
  buildHistoryErrorMessage,
  buildHistorySuccessMessage,
} from '../../dictionary/history.dictionary';
import { BaseKarmaCommandHandler } from './base.karma.command.handler';

@Injectable()
export class HistoryCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  command = 'history';

  async execute(ctx: TextCommandContext): Promise<void> {
    const user = ctx.from;
    const chat = ctx.chat;
    const language = ctx.language;

    try {
      const karmaDoc = await this.karmaService.getKarmaForUser({
        userId: user.id,
        chatId: chat.id,
      });
      const keyboard = this.keyboardService.getGroupWebAppKeyboard(
        ctx.chat,
        language,
      );

      const extra: ExtraReplyMessage = {};
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }
      const history = karmaDoc?.history ?? [];

      if (!history.length) {
        this.messageQueueService.addMessage(
          ctx.chat.id,
          buildHistoryEmptyMessage(language),
          extra,
        );
        return;
      }

      const historyMessage = formatKarmaHistory(history, {
        language,
        currentUserTelegramId: user.id,
      });
      const message = buildHistorySuccessMessage(language, { historyMessage });

      this.messageQueueService.addMessage(ctx.chat.id, message, extra);
    } catch (error) {
      this.logger.error(`Error handling /history for user ${user.id}`, error);
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildHistoryErrorMessage(language),
      );
    }
  }
}
