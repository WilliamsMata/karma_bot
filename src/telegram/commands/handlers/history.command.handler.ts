import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';
import { Update } from 'telegraf/types';
import { formatKarmaHistory } from '../command.helpers';

@Injectable()
export class HistoryCommandHandler implements ICommandHandler {
  private readonly logger = new Logger(HistoryCommandHandler.name);
  command = 'history';

  constructor(private readonly karmaService: KarmaService) {}

  async handle(ctx: Context<Update>): Promise<void> {
    if (!ctx.from || !ctx.chat) return;

    const user = ctx.from;
    const chat = ctx.chat;

    try {
      const karmaDoc = await this.karmaService.getKarmaForUser(
        user.id,
        chat.id,
      );

      const historyMessage = formatKarmaHistory(karmaDoc?.history);

      await ctx.reply(
        `📜 Your karma history (last 10 changes):\n\n${historyMessage}`,
      );
    } catch (error) {
      this.logger.error(`Error handling /history for user ${user.id}`, error);
      await ctx.reply("Sorry, I couldn't retrieve your karma history.");
    }
  }
}
