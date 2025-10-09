import { Injectable, Logger } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { formatKarmaHistory } from '../command.helpers';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { TelegramLanguageService } from '../../shared/telegram-language.service';
import {
  buildHistoryEmptyMessage,
  buildHistoryErrorMessage,
  buildHistorySuccessMessage,
} from '../../dictionary/history.dictionary';

@Injectable()
export class HistoryCommandHandler implements ITextCommandHandler {
  private readonly logger = new Logger(HistoryCommandHandler.name);
  command = 'history';

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly languageService: TelegramLanguageService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const user = ctx.from;
    const chat = ctx.chat;
    const language = await this.languageService.resolveLanguage(chat);

    try {
      const karmaDoc = await this.karmaService.getKarmaForUser({
        userId: user.id,
        chatId: chat.id,
      });
      const keyboard = this.keyboardService.getGroupWebAppKeyboard(
        ctx.chat,
        language,
      );

      const extra: ExtraReplyMessage = {};
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }
      const history = karmaDoc?.history ?? [];

      if (!history.length) {
        await ctx.reply(buildHistoryEmptyMessage(language), extra);
        return;
      }

      const historyMessage = formatKarmaHistory(history, {
        language,
        currentUserTelegramId: user.id,
      });
      const message = buildHistorySuccessMessage(language, { historyMessage });

      await ctx.reply(message, extra);
    } catch (error) {
      this.logger.error(`Error handling /history for user ${user.id}`, error);
      await ctx.reply(buildHistoryErrorMessage(language));
    }
  }
}
