import { Injectable } from '@nestjs/common';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { DEFAULT_COOLDOWN_SECONDS } from '../../../groups/group-settings.service';
import { buildHelpMessage } from '../../dictionary/help.dictionary';
import { BaseKarmaCommandHandler } from './base.karma.command.handler';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';

@Injectable()
export class HelpCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  command = 'help';

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(ctx: TextCommandContext): Promise<void> {
    const chat = ctx.chat;
    const language = ctx.language;

    const keyboard = this.keyboardService.getGroupWebAppKeyboard(
      chat,
      language,
    );

    const extra: ExtraReplyMessage = {};
    extra.parse_mode = 'Markdown';
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    const cooldownSeconds =
      ctx.groupSettings?.cooldownSeconds ?? DEFAULT_COOLDOWN_SECONDS;

    const helpMessage = buildHelpMessage(language, { cooldownSeconds });
    this.messageQueueService.addMessage(ctx.chat.id, helpMessage, extra);
  }
}
