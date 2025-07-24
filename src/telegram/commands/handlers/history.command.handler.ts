import { Injectable, Logger } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { formatKarmaHistory } from '../command.helpers';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';

@Injectable()
export class HistoryCommandHandler implements ITextCommandHandler {
  private readonly logger = new Logger(HistoryCommandHandler.name);
  command = 'history';

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const user = ctx.from;
    const chat = ctx.chat;

    try {
      const karmaDoc = await this.karmaService.getKarmaForUser(
        user.id,
        chat.id,
      );
      const keyboard = this.keyboardService.getGroupWebAppKeyboard(ctx.chat);

      const extra: ExtraReplyMessage = {};
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }
      const historyMessage = formatKarmaHistory(karmaDoc?.history);

      const message = `📜 Your karma history (last 10 changes):\n\n${historyMessage}`;

      await ctx.reply(message, extra);
    } catch (error) {
      this.logger.error(`Error handling /history for user ${user.id}`, error);
      await ctx.reply("Sorry, I couldn't retrieve your karma history.");
    }
  }
}
