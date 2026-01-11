import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import { formatUsernameForDisplay } from '../command.helpers';
import {
  buildSendBotTransferMessage,
  buildSendCriticalErrorMessage,
  buildSendInvalidAmountMessage,
  buildSendReplyRequiredMessage,
  buildSendSelfTransferMessage,
  buildSendSuccessMessage,
  buildSendUsageMessage,
} from '../../dictionary/send.dictionary';
import { BaseKarmaCommandHandler } from './base.karma.command.handler';

@Injectable()
export class SendCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  private readonly logger = new Logger(SendCommandHandler.name);
  command = /^\/send(?:@\w+)?\s+(\d+)$/;

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
        this.messageQueueService.addMessage(
          ctx.chat.id,
          buildSendReplyRequiredMessage(language),
        );
      }
      return;
    }

    const match = ctx.message.text.match(this.command);
    if (!match) {
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildSendUsageMessage(language),
      );
      return;
    }

    const sender = ctx.from;
    const receiver = ctx.message.reply_to_message.from;
    const quantity = parseInt(match[1], 10);

    if (receiver.id === sender.id) {
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildSendSelfTransferMessage(language),
      );
      return;
    }
    if (receiver.is_bot) {
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildSendBotTransferMessage(language),
      );
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildSendInvalidAmountMessage(language),
      );
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
      const result = await this.karmaService.transferKarma({
        senderData: sender,
        receiverData: receiver,
        chatData: ctx.chat,
        quantity,
        context: {
          messageId: ctx.message.message_id,
          messageDate: ctx.message.date,
        },
      });

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

      this.messageQueueService.addMessage(ctx.chat.id, message, extra);
    } catch (error) {
      this.logger.error(
        `Error during /send command from ${sender.id} to ${receiver.id}`,
        error,
      );

      if (error instanceof BadRequestException) {
        this.messageQueueService.addMessage(ctx.chat.id, error.message, extra);
      } else {
        this.messageQueueService.addMessage(
          ctx.chat.id,
          buildSendCriticalErrorMessage(language),
          extra,
        );
      }
    }
  }
}
