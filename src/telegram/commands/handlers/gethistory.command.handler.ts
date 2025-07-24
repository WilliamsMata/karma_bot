import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';
import { Update } from 'telegraf/types';
import { formatKarmaHistory } from '../command.helpers';

@Injectable()
export class GetHistoryCommandHandler implements ICommandHandler {
  private readonly logger = new Logger(GetHistoryCommandHandler.name);
  command = /^\/gethistory(?:@\w+)?\s+(.+)$/;

  constructor(private readonly karmaService: KarmaService) {}

  async handle(ctx: Context<Update>): Promise<void> {
    if (!ctx.chat || !ctx.message || !('text' in ctx.message)) return;

    const match = ctx.message.text.match(this.command);
    if (!match) return;

    const input = match[1].trim();
    try {
      const karma = await this.karmaService.findKarmaByUserQuery(
        input,
        ctx.chat.id,
      );

      const historyMessage = formatKarmaHistory(karma?.history);

      await ctx.reply(
        `📜 Karma history for ${input} (last 10 changes):\n\n${historyMessage}`,
      );
    } catch (error) {
      this.logger.error(error);
      await ctx.reply(`Sorry, I couldn't retrieve the history for "${input}".`);
    }
  }
}
