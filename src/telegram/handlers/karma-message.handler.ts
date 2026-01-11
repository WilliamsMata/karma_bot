import { Injectable, OnModuleInit } from '@nestjs/common';
import NodeCache from 'node-cache';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { TextCommandContext } from '../telegram.types';
import { SupportedLanguage } from '../../groups/group-settings.service';
import {
  buildKarmaBotWarning,
  buildKarmaCooldownMessage,
  buildKarmaSuccessMessage,
} from '../dictionary/karma-message.dictionary';
import { BaseKarmaCommandHandler } from '../commands/handlers/base.karma.command.handler';
import { ReplyRequiredGuard } from '../guards/reply-required.guard';
import { SelfInteractionGuard } from '../guards/self-interaction.guard';
import { BotInteractionGuard } from '../guards/bot-interaction.guard';
import { CooldownGuard } from '../guards/cooldown.guard';
import { TelegramGuard } from '../guards/telegram.guard';

const karmaCooldownCache: NodeCache = new NodeCache();
const KARMA_REGEX = /(^|\s)(\+|-)1(\s|$)/;

@Injectable()
export class KarmaMessageHandler
  extends BaseKarmaCommandHandler
  implements OnModuleInit
{
  command = /^$/; // Not used by standard command dispatcher but required by interface

  constructor() {
    super();
  }

  onModuleInit() {
    this.guards = [
      new ReplyRequiredGuard(),
      new SelfInteractionGuard(),
      new BotInteractionGuard(buildKarmaBotWarning),
      new CooldownGuard(
        karmaCooldownCache,
        this.messageQueueService,
        buildKarmaCooldownMessage,
      ),
    ] as TelegramGuard[];
  }

  public isApplicable(text: string): boolean {
    return KARMA_REGEX.test(text);
  }

  public async execute(ctx: TextCommandContext): Promise<void> {
    const language = ctx.language;

    try {
      // Guards have already run and validated reply, self, bot, and cooldown.
      // We can safely access sender, receiver, etc.
      // But we need to define them for the logic.

      const sender = ctx.from;
      const receiver = ctx.message.reply_to_message!.from!;
      const chat = ctx.chat;
      const cooldownSeconds = ctx.groupSettings?.cooldownSeconds ?? 60; // Default should be handled

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

      this.sendSuccessResponse(
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

  private getCooldownCacheKey(chatId: number, userId: number): string {
    return `${chatId}:${userId}`;
  }

  private sendSuccessResponse(
    ctx: TextCommandContext,
    language: SupportedLanguage,
    receiverName: string,
    newKarma: number,
  ): void {
    const keyboard = this.keyboardService.getGroupWebAppKeyboard(
      ctx.chat,
      language,
    );

    const extra: ExtraReplyMessage = {};
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    const message = buildKarmaSuccessMessage(language, {
      receiverName,
      newKarma,
    });
    this.messageQueueService.addMessage(ctx.chat.id, message, extra);
  }
}
