import { Injectable } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { formatUsernameForDisplay } from '../command.helpers';

@Injectable()
export class TopCommandHandler implements ITextCommandHandler {
  command = 'top';

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const topUsers = await this.karmaService.getTopKarma(
      ctx.chat.id,
      false,
      10,
    );
    const keyboard = this.keyboardService.getGroupWebAppKeyboard(ctx.chat);

    const extra: ExtraReplyMessage = {};
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    if (topUsers.length === 0) {
      await ctx.reply('No karma data available yet for this group.', extra);
      return;
    }

    let message = '🏆 Top 10 Karma Users:\n\n';
    topUsers.forEach((userKarma, index) => {
      const name = formatUsernameForDisplay(userKarma.user);
      message += `${index + 1}. ${name} has ${userKarma.karma} karma\n`;
    });

    await ctx.reply(message, extra);
  }
}
