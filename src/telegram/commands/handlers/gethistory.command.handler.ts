import { Injectable, Logger } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { formatKarmaHistory } from '../command.helpers';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  buildGetHistoryErrorMessage,
  buildGetHistorySuccessMessage,
  buildGetHistoryUsageMessage,
} from '../../dictionary/get-history.dictionary';
import { TelegramLanguageService } from '../../shared/telegram-language.service';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';

@Injectable()
export class GetHistoryCommandHandler implements ITextCommandHandler {
  private readonly logger = new Logger(GetHistoryCommandHandler.name);
  command = /^\/gethistory(?:@\w+)?\s+(.+)$/;

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly languageService: TelegramLanguageService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const language = await this.languageService.resolveLanguage(ctx.chat);

    const match = ctx.message.text.match(this.command);
    if (!match) {
      await ctx.reply(buildGetHistoryUsageMessage(language));
      return;
    }

    const input = match[1].trim();
    try {
      const karma = await this.karmaService.findKarmaByUserQuery(
        input,
        ctx.chat.id,
      );
      const keyboard = this.keyboardService.getGroupWebAppKeyboard(
        ctx.chat,
        language,
      );
      const extra: ExtraReplyMessage = {};
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }
      const historyMessage = formatKarmaHistory(karma?.history);

      const message = buildGetHistorySuccessMessage(language, {
        input,
        historyMessage,
      });

      await ctx.reply(message, extra);
    } catch (error) {
      this.logger.error(
        `Error handling /gethistory for input "${input}"`,
        error,
      );
      await ctx.reply(buildGetHistoryErrorMessage(language, { input }));
    }
  }
}
