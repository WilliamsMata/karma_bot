import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';

@Injectable()
export class TopCommandHandler implements ICommandHandler {
  command = 'top';

  constructor(private readonly karmaService: KarmaService) {}

  async handle(ctx: Context): Promise<void> {
    if (!ctx.chat) return;
    const topUsers = await this.karmaService.getTopKarma(
      ctx.chat.id,
      false,
      10,
    );

    if (topUsers.length === 0) {
      await ctx.reply('No karma data available yet for this group.');
      return;
    }

    let message = '🏆 Top 10 Karma Users:\n\n';
    topUsers.forEach((userKarma, index) => {
      const name = userKarma.user.userName
        ? `@${userKarma.user.userName}`
        : userKarma.user.firstName;
      message += `${index + 1}. ${name} has ${userKarma.karma} karma\n`;
    });

    await ctx.reply(message);
  }
}
