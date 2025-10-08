import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Markup } from 'telegraf';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';

@Injectable()
export class StartCommandHandler implements ITextCommandHandler {
  command = 'start';
  private readonly logger = new Logger(StartCommandHandler.name);

  constructor(private readonly configService: ConfigService) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const botUsernameFromEnv = this.configService.get<string>(
      'TELEGRAM_BOT_USERNAME',
    );

    if (!botUsernameFromEnv) {
      this.logger.error('TELEGRAM_BOT_USERNAME is not configured.');
      await ctx.reply(
        'Oops! The bot is not configured correctly. Please contact the administrator.',
      );
      return;
    }

    const botUsername = botUsernameFromEnv.replace(/^@/, '');
    const addToGroupUrl = `https://t.me/${botUsername}?startgroup=true`;

    const message = `👋 *Hello! I'm Karma Bot.*

I'm your companion to measure the good vibes in your groups. With me you can:
• Give positive karma by replying with \`+1\`.
• Give negative karma (hate) by replying with \`-1\`.
• Check rankings, histories, and transfer karma to your friends.

Ready to start? Add me to your group and let's start tracking who spreads the most good vibes.`;

    const extra: ExtraReplyMessage = {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        Markup.button.url('➕ Add to group', addToGroupUrl),
      ]).reply_markup,
    };

    await ctx.reply(message, extra);
  }
}
