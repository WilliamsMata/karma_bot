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
  HateEntry,
  buildHateEmptyMessage,
  buildHateLeaderboardMessage,
} from '../../dictionary/hate.dictionary';
import { TelegramLanguageService } from '../../shared/telegram-language.service';

@Injectable()
export class HateCommandHandler implements ITextCommandHandler {
  command = 'hate';
  private readonly logger = new Logger(HateCommandHandler.name);

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly languageService: TelegramLanguageService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const language = await this.languageService.resolveLanguage(ctx.chat);

    const hatedUsers = await this.karmaService.getTopKarma(
      ctx.chat.id,
      true,
      10,
    );

    const keyboard = this.keyboardService.getGroupWebAppKeyboard(
      ctx.chat,
      language,
    );
    const extra: ExtraReplyMessage = {};
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    if (hatedUsers.length === 0) {
      await ctx.reply(buildHateEmptyMessage(language), extra);
      return;
    }

    const entries: HateEntry[] = hatedUsers.map((userKarma, index) => ({
      position: index + 1,
      name: formatUsernameForDisplay(userKarma.user),
      karma: userKarma.karma,
    }));

    const message = buildHateLeaderboardMessage(language, entries);

    await ctx.reply(message, extra);
  }
}
