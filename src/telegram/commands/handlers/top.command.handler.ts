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
  buildTopEmptyMessage,
  buildTopMessage,
} from '../../dictionary/top.dictionary';
import { MessageQueueService } from '../../shared/message-queue.service';

@Injectable()
export class TopCommandHandler implements ITextCommandHandler {
  command = 'top';

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly languageService: TelegramLanguageService,
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const language = await this.languageService.resolveLanguage(ctx.chat);
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
