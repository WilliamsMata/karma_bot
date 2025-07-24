import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';
import { TelegramKeyboardService } from '../../telegram-keyboard.service';
import { Update } from 'telegraf/types';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

@Injectable()
export class GetKarmaCommandHandler implements ICommandHandler {
  private readonly logger = new Logger(GetKarmaCommandHandler.name);
  command = /^\/getkarma(?:@\w+)?\s+(.+)$/;

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
  ) {}

  async handle(ctx: Context<Update>): Promise<void> {
    if (!ctx.chat || !ctx.message || !('text' in ctx.message)) return;

    const match = ctx.message.text.match(this.command);
    if (!match) return;

    const input = match[1].trim();

    const keyboard = this.keyboardService.getGroupWebAppKeyboard(ctx.chat);
    const extra: ExtraReplyMessage = {};
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    try {
      const karma = await this.karmaService.findKarmaByUserQuery(
        input,
        ctx.chat.id,
      );
      if (!karma) {
        await ctx.reply(
          `No karma found for user "${input}" in this group.`,
          extra,
        );
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
      await ctx.reply(message.trim(), extra);
    } catch (error) {
      this.logger.error(error);
      await ctx.reply(`Sorry, I couldn't retrieve karma for "${input}".`);
    }
  }
}
