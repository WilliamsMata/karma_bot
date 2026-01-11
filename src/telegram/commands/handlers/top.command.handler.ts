import { Injectable } from '@nestjs/common';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { formatUsernameForDisplay } from '../command.helpers';
import {
  buildTopEmptyMessage,
  buildTopMessage,
} from '../../dictionary/top.dictionary';
import { BaseKarmaCommandHandler } from './base.karma.command.handler';

@Injectable()
export class TopCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  command = 'top';

  async execute(ctx: TextCommandContext): Promise<void> {
    const language = ctx.language;
    const topUsers = await this.karmaService.getTopKarma({
      groupId: ctx.chat.id,
      ascending: false,
      limit: 10,
    });
    const keyboard = this.keyboardService.getGroupWebAppKeyboard(
      ctx.chat,
      language,
    );

    const extra: ExtraReplyMessage = {};
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    if (topUsers.length === 0) {
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildTopEmptyMessage(language),
        extra,
      );
      return;
    }

    const entries = topUsers.map((userKarma, index) => ({
      position: index + 1,
      name: formatUsernameForDisplay(userKarma.user),
      karma: userKarma.karma ?? 0,
    }));

    const message = buildTopMessage(language, entries);

    this.messageQueueService.addMessage(ctx.chat.id, message, extra);
  }
}
