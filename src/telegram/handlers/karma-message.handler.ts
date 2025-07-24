import { Injectable, Logger } from '@nestjs/common';
import { KarmaService } from '../../karma/karma.service';
import { TelegramKeyboardService } from '../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { TextCommandContext } from '../telegram.types';

const karmaCooldowns: Record<number, number> = {};
const KARMA_COOLDOWN_MS = 60 * 1000;
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
    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.from)
      return;

    const sender = ctx.from;
    const receiver = ctx.message.reply_to_message.from;
    const match = ctx.message.text.match(KARMA_REGEX);

    if (receiver.id === sender.id) {
      this.logger.warn(`User ${sender.id} tried to give karma to themselves.`);
      return;
    }
    if (receiver.is_bot) {
      await ctx.reply('You cannot give karma to bots.');
      return;
    }

    const now = Date.now();
    const lastGivenTime = karmaCooldowns[sender.id];
    if (lastGivenTime && now - lastGivenTime < KARMA_COOLDOWN_MS) {
      const timeLeft = Math.ceil(
        (KARMA_COOLDOWN_MS - (now - lastGivenTime)) / 1000,
      );
      await ctx.reply(
        `Please wait ${timeLeft} seconds before giving karma again.`,
      );
      return;
    }

    try {
      const karmaValue = match![2] === '+' ? 1 : -1;
      const result = await this.karmaService.updateKarma(
        sender,
        receiver,
        ctx.chat,
        karmaValue,
      );

      karmaCooldowns[sender.id] = now;

      const keyboard = this.keyboardService.getGroupWebAppKeyboard(ctx.chat);
      const extra: ExtraReplyMessage = {};
      extra.reply_parameters = { message_id: ctx.message.message_id };
      if (keyboard) {
        extra.reply_markup = keyboard.reply_markup;
      }

      await ctx.telegram.sendMessage(
        ctx.chat.id,
        `${result.receiverName} now has ${result.newKarma} karma.`,
        extra,
      );
    } catch (error) {
      this.logger.error(
        `Error in karma update flow for message ${ctx.message.message_id}`,
        error,
      );
    }
  }
}
