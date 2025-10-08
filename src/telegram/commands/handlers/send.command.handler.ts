import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
  buildSendBotTransferMessage,
  buildSendCriticalErrorMessage,
  buildSendInvalidAmountMessage,
  buildSendReplyRequiredMessage,
  buildSendSelfTransferMessage,
  buildSendSuccessMessage,
  buildSendUsageMessage,
} from '../../dictionary/send.dictionary';

@Injectable()
export class SendCommandHandler implements ITextCommandHandler {
  private readonly logger = new Logger(SendCommandHandler.name);
  command = /^\/send(?:@\w+)?\s+(\d+)$/;

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly languageService: TelegramLanguageService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const language = await this.languageService.resolveLanguage(ctx.chat);
    if (
      !ctx.message ||
      !('text' in ctx.message) ||
      !ctx.from ||
      !ctx.chat ||
      !ctx.message.reply_to_message ||
      !ctx.message.reply_to_message.from
    ) {
      if (
        ctx.message &&
        'text' in ctx.message &&
        ctx.message.text.match(this.command)
      ) {
        await ctx.reply(buildSendReplyRequiredMessage(language));
      }
      return;
    }

    const match = ctx.message.text.match(this.command);
    if (!match) {
      await ctx.reply(buildSendUsageMessage(language));
      return;
    }

    const sender = ctx.from;
    const receiver = ctx.message.reply_to_message.from;
    const quantity = parseInt(match[1], 10);

    if (receiver.id === sender.id) {
      await ctx.reply(buildSendSelfTransferMessage(language));
      return;
    }
    if (receiver.is_bot) {
      await ctx.reply(buildSendBotTransferMessage(language));
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      await ctx.reply(buildSendInvalidAmountMessage(language));
      return;
    }

    const keyboard = this.keyboardService.getGroupWebAppKeyboard(
      ctx.chat,
      language,
    );

    const extra: ExtraReplyMessage = {};
    extra.reply_parameters = { message_id: ctx.message.message_id };
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    try {
      const result = await this.karmaService.transferKarma(
        sender,
        receiver,
        ctx.chat,
        quantity,
      );

      const senderName = result.senderKarma.user.userName
        ? `@${result.senderKarma.user.userName}`
        : formatUsernameForDisplay(result.senderKarma.user);
      const receiverName = result.receiverKarma.user.userName
        ? `@${result.receiverKarma.user.userName}`
        : formatUsernameForDisplay(result.receiverKarma.user);

      const message = buildSendSuccessMessage(language, {
        senderName,
        receiverName,
        quantity,
        senderKarma: result.senderKarma.karma ?? 0,
        receiverKarma: result.receiverKarma.karma ?? 0,
      });

      await ctx.telegram.sendMessage(ctx.chat.id, message, extra);
    } catch (error) {
      this.logger.error(
        `Error during /send command from ${sender.id} to ${receiver.id}`,
        error,
      );

      if (error instanceof BadRequestException) {
        await ctx.reply(error.message, extra);
      } else {
        await ctx.reply(buildSendCriticalErrorMessage(language), extra);
      }
    }
  }
}
