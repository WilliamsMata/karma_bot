import { Injectable } from '@nestjs/common';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { buildMeKarmaMessage } from '../../dictionary/me.dictionary';
import { BaseKarmaCommandHandler } from './base.karma.command.handler';

@Injectable()
export class MeCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  readonly command = 'me';

  async execute(ctx: TextCommandContext): Promise<void> {
    const user = ctx.from;
    const chat = ctx.chat;
    const language = ctx.language;

    try {
      const karmaDoc = await this.karmaService.getKarmaForUser({
        userId: user.id,
        chatId: chat.id,
      });
      const userName = user.username ? `@${user.username}` : user.first_name;

      const keyboard = this.keyboardService.getGroupWebAppKeyboard(
        ctx.chat,
        language,
      );

      const extra: ExtraReplyMessage = {};
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }

      const karma = karmaDoc?.karma ?? 0;
      const givenKarma = karmaDoc?.givenKarma ?? 0;
      const givenHate = karmaDoc?.givenHate ?? 0;

      const hasActivity = Boolean(
        karmaDoc && (karma !== 0 || givenKarma !== 0 || givenHate !== 0),
      );

      const message = buildMeKarmaMessage(language, {
        displayName: userName,
        karma,
        givenKarma,
        givenHate,
        hasActivity,
      });

      this.messageQueueService.addMessage(ctx.chat.id, message, extra);
    } catch (error) {
      this.logger.error(
        `Error handling /me command for user ${user.id}`,
        error,
      );
    }
  }
}
