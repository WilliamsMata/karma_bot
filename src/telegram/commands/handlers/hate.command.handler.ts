import { Injectable, Logger } from '@nestjs/common';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { formatUsernameForDisplay } from '../command.helpers';
import {
  HateEntry,
  buildHateEmptyMessage,
  buildHateLeaderboardMessage,
} from '../../dictionary/hate.dictionary';
import { BaseKarmaCommandHandler } from './base.karma.command.handler';

@Injectable()
export class HateCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  command = 'hate';
  private readonly logger = new Logger(HateCommandHandler.name);

  async handle(ctx: TextCommandContext): Promise<void> {
    const language = await this.languageService.resolveLanguage(ctx.chat);

    const hatedUsers = await this.karmaService.getTopKarma({
      groupId: ctx.chat.id,
      ascending: true,
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

    if (hatedUsers.length === 0) {
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildHateEmptyMessage(language),
        extra,
      );
      return;
    }

    const entries: HateEntry[] = hatedUsers.map((userKarma, index) => ({
      position: index + 1,
      name: formatUsernameForDisplay(userKarma.user),
      karma: userKarma.karma,
    }));

    const message = buildHateLeaderboardMessage(language, entries);

    this.messageQueueService.addMessage(ctx.chat.id, message, extra);
  }
}
