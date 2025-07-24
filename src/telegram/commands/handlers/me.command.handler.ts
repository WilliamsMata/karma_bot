import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { Update } from 'telegraf/types';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';

@Injectable()
export class MeCommandHandler implements ICommandHandler {
  private readonly logger = new Logger(MeCommandHandler.name);
  readonly command = 'me';

  constructor(private readonly karmaService: KarmaService) {}

  async handle(ctx: Context<Update>): Promise<void> {
    const user = ctx.from;
    const chat = ctx.chat;

    if (!user || !chat) return;

    try {
      const karmaDoc = await this.karmaService.getKarmaForUser(
        user.id,
        chat.id,
      );
      const userName = user.username ? `@${user.username}` : user.first_name;

      if (
        !karmaDoc ||
        (karmaDoc.karma === 0 &&
          karmaDoc.givenKarma === 0 &&
          karmaDoc.givenHate === 0)
      ) {
        const message = `🙋 Hi ${userName}, your karma is 0 in this group.\n\n♥ Given karma: 0.\n😠 Given hate: 0.`;
        await ctx.reply(message);
        return;
      }

      const message = `🙋 Hi ${userName}, your karma is ${karmaDoc.karma || 0} in this group.\n\n♥ Given karma: ${karmaDoc.givenKarma || 0}.\n😠 Given hate: ${karmaDoc.givenHate || 0}.`;
      await ctx.reply(message);
    } catch (error) {
      this.logger.error(
        `Error handling /me command for user ${user.id}`,
        error,
      );
    }
  }
}
