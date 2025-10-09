import { Injectable, Logger } from '@nestjs/common';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { User, Chat } from 'telegraf/types';
import * as NodeCache from 'node-cache';
import { KarmaService } from '../../karma/karma.service';
import { TelegramKeyboardService } from '../shared/telegram-keyboard.service';
import { TextCommandContext } from '../telegram.types';
import {
  GroupSettingsService,
  SupportedLanguage,
} from '../../groups/group-settings.service';
import {
  buildKarmaBotWarning,
  buildKarmaCooldownMessage,
  buildKarmaSuccessMessage,
} from '../dictionary/karma-message.dictionary';
import { TelegramLanguageService } from '../shared/telegram-language.service';

const karmaCooldownCache = new NodeCache();
const KARMA_REGEX = /(^|\s)(\+|-)1(\s|$)/;

@Injectable()
export class KarmaMessageHandler {
  private readonly logger = new Logger(KarmaMessageHandler.name);

  constructor(
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    private readonly groupSettingsService: GroupSettingsService,
    private readonly languageService: TelegramLanguageService,
  ) {}

  public isApplicable(text: string): boolean {
    return KARMA_REGEX.test(text);
  }

  public async handle(ctx: TextCommandContext): Promise<void> {
    const language = await this.languageService.resolveLanguage(ctx.chat);

    const validationResult = await this.runPreChecks(ctx, language);
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

      const result = await this.karmaService.updateKarma({
        senderData: sender,
        receiverData: receiver,
        chatData: chat,
        incValue: karmaValue,
        context: {
          messageId: ctx.message.message_id,
          messageDate: ctx.message.date,
        },
      });

      const cacheKey = this.getCooldownCacheKey(chat.id, sender.id);
      karmaCooldownCache.set(cacheKey, true, cooldownSeconds);

      await this.sendSuccessResponse(
        ctx,
        language,
        result.receiverName,
        result.newKarma,
      );
    } catch (error) {
      this.logger.error(
        `Error in karma update flow for message ${ctx.message.message_id}`,
        error,
      );
    }
  }

  private async runPreChecks(
    ctx: TextCommandContext,
    language: SupportedLanguage,
  ): Promise<{
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
      return {
        isValid: false,
        replyMessage: buildKarmaBotWarning(language),
      };
    }

    const chatId = ctx.chat.id;
    const cooldownSeconds =
      await this.groupSettingsService.getCooldownSeconds(chatId);
    const cacheKey = this.getCooldownCacheKey(chatId, sender.id);

    if (karmaCooldownCache.get(cacheKey)) {
      const ttl = karmaCooldownCache.getTtl(cacheKey);
      const secondsLeft = Math.max(
        1,
        ttl ? Math.ceil((ttl - Date.now()) / 1000) : cooldownSeconds,
      );
      return {
        isValid: false,
        replyMessage: buildKarmaCooldownMessage(language, {
          secondsLeft,
        }),
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
    language: SupportedLanguage,
    receiverName: string,
    newKarma: number,
  ): Promise<void> {
    const keyboard = this.keyboardService.getGroupWebAppKeyboard(
      ctx.chat,
      language,
    );

    const extra: ExtraReplyMessage = {
      reply_parameters: { message_id: ctx.message.message_id },
    };

    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    const message = buildKarmaSuccessMessage(language, {
      receiverName,
      newKarma,
    });

    await ctx.telegram.sendMessage(ctx.chat.id, message, extra);
  }
}
