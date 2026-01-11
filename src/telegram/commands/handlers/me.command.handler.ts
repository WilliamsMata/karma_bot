import { Injectable, Logger } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { buildMeKarmaMessage } from '../../dictionary/me.dictionary';
import { TelegramLanguageService } from '../../shared/telegram-language.service';
import { MessageQueueService } from '../../shared/message-queue.service';

@Injectable()
export class MeCommandHandler implements ITextCommandHandler {
  private readonly logger = new Logger(MeCommandHandler.name);
  readonly command = 'me';

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly languageService: TelegramLanguageService,
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const user = ctx.from;
    const chat = ctx.chat;
    const language = await this.languageService.resolveLanguage(ctx.chat);

    try {
      const karmaDoc = await this.karmaService.getKarmaForUser({
        userId: user.id,
        chatId: chat.id,
      });
      const userName = user.username ? `@${user.username}` : user.first_name;

      const keyboard = this.keyboardService.getGroupWebAppKeyboard(
        ctx.chat,
        language,
      );

      const extra: ExtraReplyMessage = {};
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }

      const karma = karmaDoc?.karma ?? 0;
      const givenKarma = karmaDoc?.givenKarma ?? 0;
      const givenHate = karmaDoc?.givenHate ?? 0;

      const hasActivity = Boolean(
        karmaDoc && (karma !== 0 || givenKarma !== 0 || givenHate !== 0),
      );

      const message = buildMeKarmaMessage(language, {
        displayName: userName,
        karma,
        givenKarma,
        givenHate,
        hasActivity,
      });

      this.messageQueueService.addMessage(ctx.chat.id, message, extra);
    } catch (error) {
      this.logger.error(
        `Error handling /me command for user ${user.id}`,
        error,
      );
    }
  }
}
