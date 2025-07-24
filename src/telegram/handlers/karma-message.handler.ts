import { Injectable, Logger } from '@nestjs/common';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { User, Chat } from 'telegraf/types';
import * as NodeCache from 'node-cache';
import { KarmaService } from '../../karma/karma.service';
import { TelegramKeyboardService } from '../shared/telegram-keyboard.service';
import { TextCommandContext } from '../telegram.types';

const karmaCooldownCache = new NodeCache({ stdTTL: 60 });
const KARMA_REGEX = /(^|\s)(\+|-)1(\s|$)/;

@Injectable()
export class KarmaMessageHandler {
  private readonly logger = new Logger(KarmaMessageHandler.name);

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
  ) {}

  public isApplicable(text: string): boolean {
    return KARMA_REGEX.test(text);
  }

  public async handle(ctx: TextCommandContext): Promise<void> {
    const validationResult = this.runPreChecks(ctx);
    if (!validationResult.isValid) {
      if (validationResult.replyMessage) {
        await ctx.reply(validationResult.replyMessage);
      }
      return;
    }

    try {
      const { sender, receiver, chat } = validationResult.data!;
      const match = ctx.message.text.match(KARMA_REGEX)!;
      const karmaValue = match[2] === '+' ? 1 : -1;

      const result = await this.karmaService.updateKarma(
        sender,
        receiver,
        chat,
        karmaValue,
      );

      karmaCooldownCache.set(sender.id, true, 60);

      await this.sendSuccessResponse(ctx, result.receiverName, result.newKarma);
    } catch (error) {
      this.logger.error(
        `Error in karma update flow for message ${ctx.message.message_id}`,
        error,
      );
    }
  }

  private runPreChecks(ctx: TextCommandContext): {
    isValid: boolean;
    replyMessage?: string;
    data?: { sender: User; receiver: User; chat: Chat };
  } {
    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.from) {
      return { isValid: false };
    }

    const sender = ctx.from;
    const receiver = ctx.message.reply_to_message.from;

    if (receiver.id === sender.id) {
      this.logger.warn(`User ${sender.id} tried to give karma to themselves.`);
      return { isValid: false };
    }

    if (receiver.is_bot) {
      return { isValid: false, replyMessage: 'You cannot give karma to bots.' };
    }

    if (karmaCooldownCache.get(sender.id)) {
      const timeLeft = Math.ceil(
        (karmaCooldownCache.getTtl(sender.id)! - Date.now()) / 1000,
      );
      return {
        isValid: false,
        replyMessage: `Please wait ${timeLeft} seconds before giving karma again.`,
      };
    }

    return { isValid: true, data: { sender, receiver, chat: ctx.chat } };
  }

  private async sendSuccessResponse(
    ctx: TextCommandContext,
    receiverName: string,
    newKarma: number,
  ): Promise<void> {
    const keyboard = this.keyboardService.getGroupWebAppKeyboard(ctx.chat);

    const extra: ExtraReplyMessage = {
      reply_parameters: { message_id: ctx.message.message_id },
    };

    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    const message = `${receiverName} now has ${newKarma} karma.`;

    await ctx.telegram.sendMessage(ctx.chat.id, message, extra);
  }
}
