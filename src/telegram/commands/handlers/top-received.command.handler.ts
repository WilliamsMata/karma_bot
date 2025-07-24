import { Injectable, Logger } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';

@Injectable()
export class TopReceivedCommandHandler implements ITextCommandHandler {
  private readonly logger = new Logger(TopReceivedCommandHandler.name);
  command = /^\/(today|month|year)/;

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const match = ctx.message.text.match(this.command);
    if (!match) return;

    const commandName = match[1];
    let daysBack: number;
    let periodName: string;

    switch (commandName) {
      case 'today':
        daysBack = 1;
        periodName = 'last 24 hours';
        break;
      case 'month':
        daysBack = 30;
        periodName = 'last 30 days';
        break;
      case 'year':
        daysBack = 365;
        periodName = 'last 365 days';
        break;
      default:
        return;
    }

    try {
      const topUsers = await this.karmaService.getTopUsersByKarmaReceived(
        ctx.chat.id,
        daysBack,
        10,
      );
      const keyboard = this.keyboardService.getGroupWebAppKeyboard(ctx.chat);

      const extra: ExtraReplyMessage = {};
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }

      if (topUsers.length === 0) {
        await ctx.reply(
          `No users received karma in the ${periodName} in this group.`,
          extra,
        );
        return;
      }

      let message = `🌟 Top 10 users by karma received in the ${periodName}:\n\n`;
      topUsers.forEach((user, index) => {
        const name = user.userName ? `@${user.userName}` : user.firstName;
        message += `${index + 1}. ${name} received ${user.totalKarmaReceived} karma\n`;
      });

      await ctx.reply(message, extra);
    } catch (error) {
      this.logger.error(`Error handling /${commandName}`, error);
      await ctx.reply(
        `Sorry, I couldn't retrieve the top users for the ${periodName}.`,
      );
    }
  }
}
