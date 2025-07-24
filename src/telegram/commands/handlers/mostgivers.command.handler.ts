import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';

@Injectable()
export class MostGiversCommandHandler implements ICommandHandler {
  command = 'mostgivers';

  constructor(private readonly karmaService: KarmaService) {}

  async handle(ctx: Context): Promise<void> {
    if (!ctx.chat) return;
    const { topGivenKarma, topGivenHate } = await this.karmaService.getTopGiven(
      ctx.chat.id,
      10,
    );

    let message = '';
    if (topGivenKarma.length > 0) {
      message += '♥ Top 10 Karma Givers:\n\n';
      topGivenKarma.forEach((userKarma, index) => {
        const name = userKarma.user.userName
          ? `@${userKarma.user.userName}`
          : userKarma.user.firstName;
        message += `${index + 1}. ${name} has given ${userKarma.givenKarma} karma\n`;
      });
    } else {
      message += '♥ No users have given positive karma yet.\n';
    }

    message += '\n';

    if (topGivenHate.length > 0) {
      message += '😠 Top 10 Hate Givers:\n\n';
      topGivenHate.forEach((userKarma, index) => {
        const name = userKarma.user.userName
          ? `@${userKarma.user.userName}`
          : userKarma.user.firstName;
        message += `${index + 1}. ${name} has given ${userKarma.givenHate} hate\n`;
      });
    } else {
      message += '😠 No users have given negative karma (hate) yet.\n';
    }

    await ctx.reply(message.trim());
  }
}
