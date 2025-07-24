import { Injectable, Logger } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { formatUsernameForDisplay } from '../command.helpers';

@Injectable()
export class GetKarmaCommandHandler implements ITextCommandHandler {
  private readonly logger = new Logger(GetKarmaCommandHandler.name);
  command = /^\/getkarma(?:@\w+)?\s+(.+)$/;

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
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

      const displayName = formatUsernameForDisplay(karma.user);
      const message = `
👤 User: ${displayName}
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
