import { Injectable } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { formatUsernameForDisplay } from '../command.helpers';
import { TelegramLanguageService } from '../../shared/telegram-language.service';
import {
  buildMostGiversEmptyNegative,
  buildMostGiversEmptyPositive,
  buildMostGiversNegativeMessage,
  buildMostGiversPositiveMessage,
} from '../../dictionary/mostgivers.dictionary';
import { MessageQueueService } from '../../shared/message-queue.service';

@Injectable()
export class MostGiversCommandHandler implements ITextCommandHandler {
  command = 'mostgivers';

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly languageService: TelegramLanguageService,
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const language = await this.languageService.resolveLanguage(ctx.chat);
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
