import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';

@Injectable()
export class GetKarmaCommandHandler implements ICommandHandler {
  private readonly logger = new Logger(GetKarmaCommandHandler.name);
  command = /^\/getkarma(?:@\w+)?\s+(.+)$/;

  constructor(private readonly karmaService: KarmaService) {}

  async handle(ctx: Context): Promise<void> {
    if (!ctx.message) return;
    if (!ctx.chat || !('text' in ctx.message)) return;
    const match = ctx.message.text.match(this.command);
    if (!match) return;

    const input = match[1].trim();
    try {
      const karma = await this.karmaService.findKarmaByUserQuery(
        input,
        ctx.chat.id,
      );
      if (!karma) {
        await ctx.reply(`No karma found for user "${input}" in this group.`);
        return;
      }

      const userName = karma.user.userName
        ? `@${karma.user.userName}`
        : karma.user.firstName;
      const message = `
👤 User: ${userName}
✨ Karma: ${karma.karma || 0} in this group

♥ Given karma: ${karma.givenKarma || 0}.
😠 Given hate: ${karma.givenHate || 0}.
      `;
      await ctx.reply(message.trim());
    } catch (error) {
      this.logger.error(error);
      await ctx.reply(`Sorry, I couldn't retrieve karma for "${input}".`);
    }
  }
}
