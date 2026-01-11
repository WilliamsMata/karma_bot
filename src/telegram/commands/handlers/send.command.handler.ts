import { Injectable, BadRequestException } from '@nestjs/common';
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
import {
  ReplyRequiredGuard,
  SelfInteractionGuard,
  BotInteractionGuard,
} from '../../guards';

@Injectable()
export class SendCommandHandler
  extends BaseKarmaCommandHandler
  implements ITextCommandHandler
{
  command = /^\/send(?:@\w+)?(?:\s+(.*))?$/;

  constructor() {
    super();
    this.guards = [
      new ReplyRequiredGuard(buildSendReplyRequiredMessage),
      new SelfInteractionGuard(buildSendSelfTransferMessage),
      new BotInteractionGuard(buildSendBotTransferMessage),
    ];
  }

  async execute(ctx: TextCommandContext): Promise<void> {
    const language = ctx.language;

    const match = ctx.message.text.match(this.command);
    const amountStr = match?.[1]?.trim();

    if (!amountStr || !/^\d+$/.test(amountStr)) {
      this.messageQueueService.addMessage(
        ctx.chat.id,
        buildSendUsageMessage(language),
      );
      return;
    }

    const sender = ctx.from;
    const receiver = ctx.message.reply_to_message!.from!;
    const quantity = parseInt(amountStr, 10);

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
