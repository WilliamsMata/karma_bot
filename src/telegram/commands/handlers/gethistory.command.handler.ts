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
export class GetHistoryCommandHandler implements ITextCommandHandler {
  private readonly logger = new Logger(GetHistoryCommandHandler.name);
  command = /^\/gethistory(?:@\w+)?\s+(.+)$/;

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const match = ctx.message.text.match(this.command);
    if (!match) {
      await ctx.reply(
        'Please specify a user. Usage: /gethistory <name or @username>',
      );
      return;
    }

    const input = match[1].trim();
    try {
      const karma = await this.karmaService.findKarmaByUserQuery(
        input,
        ctx.chat.id,
      );
      const keyboard = this.keyboardService.getGroupWebAppKeyboard(ctx.chat);
      const extra: ExtraReplyMessage = {};
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }
      const historyMessage = formatKarmaHistory(karma?.history);

      const message = `📜 Karma history for ${input} (last 10 changes):\n\n${historyMessage}`;

      await ctx.reply(message, extra);
    } catch (error) {
      this.logger.error(
        `Error handling /gethistory for input "${input}"`,
        error,
      );
      await ctx.reply(`Sorry, I couldn't retrieve the history for "${input}".`);
    }
  }
}
