import { Injectable } from '@nestjs/common';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { formatUsernameForDisplay } from '../command.helpers';
import {
  TopReceivedPeriod,
  buildTopReceivedEmptyMessage,
  buildTopReceivedErrorMessage,
  buildTopReceivedLeaderboardMessage,
} from '../../dictionary/leaderboard.dictionary';
import { BaseKarmaCommandHandler } from './base.karma.command.handler';

@Injectable()
export class TopReceivedCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  command = /^\/(today|month|year)/;

  async execute(ctx: TextCommandContext): Promise<void> {
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

    const language = ctx.language;

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
        value: user.totalKarmaReceived ?? 0,
      }));

      const message = buildTopReceivedLeaderboardMessage(
        language,
        commandName,
        entries,
      );
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
