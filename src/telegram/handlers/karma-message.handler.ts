import { Injectable, Logger } from '@nestjs/common';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { User, Chat } from 'telegraf/types';
import * as NodeCache from 'node-cache';
import { KarmaService } from '../../karma/karma.service';
import { TelegramKeyboardService } from '../shared/telegram-keyboard.service';
import { TextCommandContext } from '../telegram.types';
import { GroupSettingsService } from '../../groups/group-settings.service';

const karmaCooldownCache = new NodeCache();
const KARMA_REGEX = /(^|\s)(\+|-)1(\s|$)/;

@Injectable()
export class KarmaMessageHandler {
  private readonly logger = new Logger(KarmaMessageHandler.name);

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly groupSettingsService: GroupSettingsService,
  ) {}

  public isApplicable(text: string): boolean {
    return KARMA_REGEX.test(text);
  }

  public async handle(ctx: TextCommandContext): Promise<void> {
    const validationResult = await this.runPreChecks(ctx);
    if (!validationResult.isValid) {
      if (validationResult.replyMessage) {
        await ctx.reply(validationResult.replyMessage);
      }
      return;
    }

    try {
      const { sender, receiver, chat, cooldownSeconds } =
        validationResult.data!;
      const match = ctx.message.text.match(KARMA_REGEX)!;
      const karmaValue = match[2] === '+' ? 1 : -1;

      const result = await this.karmaService.updateKarma(
        sender,
        receiver,
        chat,
        karmaValue,
      );

      const cacheKey = this.getCooldownCacheKey(chat.id, sender.id);
      karmaCooldownCache.set(cacheKey, true, cooldownSeconds);

      await this.sendSuccessResponse(ctx, result.receiverName, result.newKarma);
    } catch (error) {
      this.logger.error(
        `Error in karma update flow for message ${ctx.message.message_id}`,
        error,
      );
    }
  }

  private async runPreChecks(ctx: TextCommandContext): Promise<{
    isValid: boolean;
    replyMessage?: string;
    data?: {
      sender: User;
      receiver: User;
      chat: Chat;
      cooldownSeconds: number;
    };
  }> {
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

    const chatId = ctx.chat.id;
    const cooldownSeconds =
      await this.groupSettingsService.getCooldownSeconds(chatId);
    const cacheKey = this.getCooldownCacheKey(chatId, sender.id);

    if (karmaCooldownCache.get(cacheKey)) {
      const timeLeft = Math.ceil(
        (karmaCooldownCache.getTtl(cacheKey)! - Date.now()) / 1000,
      );
      return {
        isValid: false,
        replyMessage: `Please wait ${timeLeft} seconds before giving karma again.`,
      };
    }

    return {
      isValid: true,
      data: { sender, receiver, chat: ctx.chat, cooldownSeconds },
    };
  }

  private getCooldownCacheKey(chatId: number, userId: number): string {
    return `${chatId}:${userId}`;
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
