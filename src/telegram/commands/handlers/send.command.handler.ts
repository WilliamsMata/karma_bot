import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';
import { Update } from 'telegraf/types';

@Injectable()
export class SendCommandHandler implements ICommandHandler {
  private readonly logger = new Logger(SendCommandHandler.name);
  command = /^\/send(?:@\w+)?\s+(\d+)$/;

  constructor(private readonly karmaService: KarmaService) {}

  async handle(ctx: Context<Update>): Promise<void> {
    // --- TYPE GUARDS: La solución a la mayoría de los errores ---
    // 1. Aseguramos que el contexto tiene las propiedades que necesitamos.
    if (!ctx.message || !('text' in ctx.message) || !ctx.from || !ctx.chat) {
      return;
    }
    // 2. Aseguramos que es una respuesta a otro mensaje con autor.
    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.from) {
      await ctx.reply(
        "You need to reply to a user's message to send them karma.",
      );
      return;
    }

    const match = ctx.message.text.match(this.command);
    if (!match) {
      await ctx.reply('You need to specify the amount to send. Ex: /send 10');
      return;
    }

    // A partir de aquí, TypeScript sabe que las propiedades son seguras.
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

    try {
      // Gracias al Paso 1, 'result' ahora está correctamente tipado.
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

      await ctx.telegram.sendMessage(
        ctx.chat.id,
        `💸 ${senderName} has sent ${quantity} karma to ${receiverName}!\n\n${senderName} new karma: ${result.senderKarma.karma}\n${receiverName} new karma: ${result.receiverKarma.karma}`,
        { reply_parameters: { message_id: ctx.message.message_id } },
      );
    } catch (error) {
      this.logger.error(
        `Error in send command for message ${ctx.message.message_id}`,
        error,
      );
      await ctx.reply('An error occurred while processing your request.');
    }
  }
}
