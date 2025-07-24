import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';
import { Update } from 'telegraf/types';
import { formatKarmaHistory } from '../command.helpers';
import { TelegramKeyboardService } from '../../telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

@Injectable()
export class GetHistoryCommandHandler implements ICommandHandler {
  private readonly logger = new Logger(GetHistoryCommandHandler.name);
  command = /^\/gethistory(?:@\w+)?\s+(.+)$/;

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
  ) {}

  async handle(ctx: Context<Update>): Promise<void> {
    if (!ctx.chat || !ctx.message || !('text' in ctx.message)) return;

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
