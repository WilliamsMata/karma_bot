import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Context } from 'telegraf';
import { Update } from 'telegraf/types';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';
import { TelegramKeyboardService } from '../../telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

@Injectable()
export class SendCommandHandler implements ICommandHandler {
  private readonly logger = new Logger(SendCommandHandler.name);
  command = /^\/send(?:@\w+)?\s+(\d+)$/;

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
  ) {}

  async handle(ctx: Context<Update>): Promise<void> {
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
        await ctx.reply(
          "You need to reply to a user's message to send them karma.",
        );
      }
      return;
    }

    const match = ctx.message.text.match(this.command);
    if (!match) {
      await ctx.reply('You need to specify the amount to send. Ex: /send 10');
      return;
    }

    const sender = ctx.from;
    const receiver = ctx.message.reply_to_message.from;
    const quantity = parseInt(match[1], 10);

    if (receiver.id === sender.id) {
      await ctx.reply('You cannot send karma to yourself.');
      return;
    }
    if (receiver.is_bot) {
      await ctx.reply('You cannot send karma to bots.');
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      await ctx.reply(
        'The amount must be a positive whole number. Ex: /send 10',
      );
      return;
    }

    const keyboard = this.keyboardService.getGroupWebAppKeyboard(ctx.chat);

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
        : result.senderKarma.user.firstName;
      const receiverName = result.receiverKarma.user.userName
        ? `@${result.receiverKarma.user.userName}`
        : result.receiverKarma.user.firstName;

      const message = `💸 ${senderName} has sent ${quantity} karma to ${receiverName}!\n\n${senderName} new karma: ${result.senderKarma.karma}\n${receiverName} new karma: ${result.receiverKarma.karma}`;

      await ctx.telegram.sendMessage(ctx.chat.id, message, extra);
    } catch (error) {
      this.logger.error(
        `Error during /send command from ${sender.id} to ${receiver.id}`,
        error,
      );

      if (error instanceof BadRequestException) {
        await ctx.reply(error.message, extra);
      } else {
        await ctx.reply(
          'A critical error occurred during the karma transfer.',
          extra,
        );
      }
    }
  }
}
