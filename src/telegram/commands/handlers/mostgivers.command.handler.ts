import { Injectable } from '@nestjs/common';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { formatUsernameForDisplay } from '../command.helpers';
import {
  buildMostGiversEmptyNegative,
  buildMostGiversEmptyPositive,
  buildMostGiversNegativeMessage,
  buildMostGiversPositiveMessage,
} from '../../dictionary/mostgivers.dictionary';
import { BaseKarmaCommandHandler } from './base.karma.command.handler';

@Injectable()
export class MostGiversCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  command = 'mostgivers';

  async execute(ctx: TextCommandContext): Promise<void> {
    const language = ctx.language;
    const { topGivenKarma, topGivenHate } = await this.karmaService.getTopGiven(
      {
        groupId: ctx.chat.id,
        limit: 10,
      },
    );
    const keyboard = this.keyboardService.getGroupWebAppKeyboard(
      ctx.chat,
      language,
    );

    const extra: ExtraReplyMessage = {};
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    const sections: string[] = [];

    if (topGivenKarma.length > 0) {
      const entries = topGivenKarma.map((userKarma, index) => ({
        position: index + 1,
        name: userKarma.user.userName
          ? `@${userKarma.user.userName}`
          : formatUsernameForDisplay(userKarma.user),
        value: userKarma.givenKarma ?? 0,
      }));
      sections.push(buildMostGiversPositiveMessage(language, entries));
    } else {
      sections.push(buildMostGiversEmptyPositive(language));
    }

    if (topGivenHate.length > 0) {
      const entries = topGivenHate.map((userKarma, index) => ({
        position: index + 1,
        name: formatUsernameForDisplay(userKarma.user),
        value: userKarma.givenHate ?? 0,
      }));
      sections.push(buildMostGiversNegativeMessage(language, entries));
    } else {
      sections.push(buildMostGiversEmptyNegative(language));
    }

    const message = sections.join('\n\n').trim();
    this.messageQueueService.addMessage(ctx.chat.id, message, extra);
  }
}
