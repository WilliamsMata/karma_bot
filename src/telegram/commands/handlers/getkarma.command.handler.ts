import { Injectable, Logger } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
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
import { TelegramLanguageService } from '../../shared/telegram-language.service';

@Injectable()
export class GetKarmaCommandHandler implements ITextCommandHandler {
  private readonly logger = new Logger(GetKarmaCommandHandler.name);
  command = /^\/getkarma(?:@\w+)?\s+(.+)$/;

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly languageService: TelegramLanguageService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const match = ctx.message.text.match(this.command);
    const language = await this.languageService.resolveLanguage(ctx.chat);

    if (!match) {
      await ctx.reply(buildGetKarmaUsageMessage(language));
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
      const karma = await this.karmaService.findKarmaByUserQuery(
        input,
        ctx.chat.id,
      );
      if (!karma) {
        await ctx.reply(
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
      await ctx.reply(message, extra);
    } catch (error) {
      this.logger.error(error);
      await ctx.reply(buildGetKarmaErrorMessage(language, { input }));
    }
  }
}
