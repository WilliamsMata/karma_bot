import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';
import { Update } from 'telegraf/types';
import { TelegramKeyboardService } from '../../telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

@Injectable()
export class MeCommandHandler implements ICommandHandler {
  private readonly logger = new Logger(MeCommandHandler.name);
  readonly command = 'me';

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
  ) {}

  async handle(ctx: Context<Update>): Promise<void> {
    if (!ctx.from || !ctx.chat) return;

    const user = ctx.from;
    const chat = ctx.chat;

    try {
      const karmaDoc = await this.karmaService.getKarmaForUser(
        user.id,
        chat.id,
      );
      const userName = user.username ? `@${user.username}` : user.first_name;

      const keyboard = this.keyboardService.getGroupWebAppKeyboard(ctx.chat);

      const extra: ExtraReplyMessage = {};
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }

      let message: string;
      if (
        !karmaDoc ||
        (karmaDoc.karma === 0 &&
          karmaDoc.givenKarma === 0 &&
          karmaDoc.givenHate === 0)
      ) {
        message = `🙋 Hi ${userName}, your karma is 0 in this group.\n\n♥ Given karma: 0.\n😠 Given hate: 0.`;
      } else {
        message = `🙋 Hi ${userName}, your karma is ${karmaDoc.karma || 0} in this group.\n\n♥ Given karma: ${karmaDoc.givenKarma || 0}.\n😠 Given hate: ${karmaDoc.givenHate || 0}.`;
      }

      await ctx.reply(message, extra);
    } catch (error) {
      this.logger.error(
        `Error handling /me command for user ${user.id}`,
        error,
      );
    }
  }
}
