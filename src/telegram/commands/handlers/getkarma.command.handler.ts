import { Injectable } from '@nestjs/common';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { formatUsernameForDisplay } from '../command.helpers';
import {
  buildGetKarmaErrorMessage,
  buildGetKarmaNotFoundMessage,
  buildGetKarmaSuccessMessage,
  buildGetKarmaUsageMessage,
} from '../../dictionary/get-karma.dictionary';
import { BaseKarmaCommandHandler } from './base.karma.command.handler';

@Injectable()
export class GetKarmaCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  command = /^\/getkarma(?:@\w+)?\s+(.+)$/;

  async execute(ctx: TextCommandContext): Promise<void> {
    const match = ctx.message.text.match(this.command);
    const language = ctx.language;

    if (!match) {
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildGetKarmaUsageMessage(language),
      );
      return;
    }

    const input = match[1].trim();

    const keyboard = this.keyboardService.getGroupWebAppKeyboard(
      ctx.chat,
      language,
    );
    const extra: ExtraReplyMessage = {};
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    try {
      const karma = await this.karmaService.findKarmaByUserQuery({
        input,
        groupId: ctx.chat.id,
      });
      if (!karma) {
        this.messageQueueService.addMessage(
          ctx.chat.id,
          buildGetKarmaNotFoundMessage(language, { input }),
          extra,
        );
        return;
      }

      const displayName = formatUsernameForDisplay(karma.user);
      const message = buildGetKarmaSuccessMessage(language, {
        displayName,
        karma: karma.karma || 0,
        givenKarma: karma.givenKarma || 0,
        givenHate: karma.givenHate || 0,
      });
      this.messageQueueService.addMessage(ctx.chat.id, message, extra);
    } catch (error) {
      this.logger.error(error);
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildGetKarmaErrorMessage(language, { input }),
      );
    }
  }
}
