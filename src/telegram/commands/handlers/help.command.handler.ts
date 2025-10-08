import { Injectable } from '@nestjs/common';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';

@Injectable()
export class HelpCommandHandler implements ITextCommandHandler {
  command = 'help';

  constructor(private readonly keyboardService: TelegramKeyboardService) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const keyboard = this.keyboardService.getGroupWebAppKeyboard(ctx.chat);

    const extra: ExtraReplyMessage = {};
    extra.parse_mode = 'Markdown';
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    const helpMessage = `
Hello! I'm the Karma Bot. Here's how you can interact with me:

*Basic Karma:*
  • Reply to a message with \`+1\` to give karma.
  • Reply to a message with \`-1\` to give hate (negative karma).
  *(Cooldown: 1 minute between giving karma/hate)*

*Check Karma:*
  • \`/me\`: Shows your current karma, given karma, and given hate.
  • \`/getkarma <name or @username>\`: Shows the karma details of a specific user.

*Leaderboards:*
  • \`/top\`: Top 10 users with the most karma.
  • \`/hate\`: Top 10 users with the least karma (most hated).
  • \`/mostgivers\`: Top 10 users who gave the most karma and hate.
  • \`/today\`: Top 10 users who received the most karma in the last 24 hours.
  • \`/month\`: Top 10 users who received the most karma in the last 30 days.
  • \`/year\`: Top 10 users who received the most karma in the last 365 days.

*History:*
  • \`/history\`: Shows your last 10 karma changes.
  • \`/gethistory <name or @username>\`: Shows the last 10 karma changes for a specific user.

*Transfer Karma:*
  • \`/send <amount>\`: Reply to a user's message to send them a specific amount of your karma. (e.g., \`/send 5\`)

*Other:*
  • \`/help\`: Shows this help message.
  • \`/settings\`: Opens the group settings menu (admins only).
    `;
    await ctx.reply(helpMessage.trim(), extra);
  }
}
