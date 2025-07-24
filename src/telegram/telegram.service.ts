import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { KarmaService } from '../karma/karma.service';
import { Update } from 'telegraf/types';
import { ICommandHandler } from './commands/command.interface';
import { TopCommandHandler } from './commands/handlers/top.command.handler';
import { MeCommandHandler } from './commands/handlers/me.command.handler';
import { HateCommandHandler } from './commands/handlers/hate.command.handler';
import { MostGiversCommandHandler } from './commands/handlers/mostgivers.command.handler';
import { HelpCommandHandler } from './commands/handlers/help.command.handler';
import { GetKarmaCommandHandler } from './commands/handlers/getkarma.command.handler';
import { SendCommandHandler } from './commands/handlers/send.command.handler';
import { HistoryCommandHandler } from './commands/handlers/history.command.handler';
import { GetHistoryCommandHandler } from './commands/handlers/gethistory.command.handler';
import { TopReceivedCommandHandler } from './commands/handlers/top-received.command.handler';
import { TelegramKeyboardService } from './telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

const karmaCooldowns: Record<number, number> = {};
const KARMA_COOLDOWN_MS = 60 * 1000; // 1 minuto
const KARMA_REGEX = /(^|\s)(\+|-)1(\s|$)/;

@Injectable()
export class TelegramService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf<Context<Update>>;

  private readonly commandHandlers = new Map<string, ICommandHandler>();

  constructor(
    private readonly configService: ConfigService,
    private readonly karmaService: KarmaService,
    private readonly keyboardService: TelegramKeyboardService,
    meHandler: MeCommandHandler,
    topHandler: TopCommandHandler,
    hateHandler: HateCommandHandler,
    mostGiversHandler: MostGiversCommandHandler,
    helpHandler: HelpCommandHandler,
    getKarmaHandler: GetKarmaCommandHandler,
    sendHandler: SendCommandHandler,
    historyHandler: HistoryCommandHandler,
    getHistoryHandler: GetHistoryCommandHandler,
    topReceivedHandler: TopReceivedCommandHandler,
  ) {
    const handlers: ICommandHandler[] = [
      meHandler,
      topHandler,
      hateHandler,
      mostGiversHandler,
      helpHandler,
      getKarmaHandler,
      sendHandler,
      historyHandler,
      getHistoryHandler,
      topReceivedHandler,
    ];

    handlers.forEach((handler) => this.registerCommand(handler));
  }

  onModuleInit() {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.bot = new Telegraf(botToken!);

    this.registerListeners();

    this.bot.launch().catch((err) => {
      this.logger.error('Failed to launch the bot', err);
    });

    this.logger.log('Telegram Bot started successfully.');
  }

  private registerListeners() {
    this.bot.on(message('text'), async (ctx, next) => {
      if (ctx.message.text.startsWith('/')) {
        return next();
      }

      // La lógica para dar/quitar karma se queda aquí, ya que es un evento de MENSAJE.
      if (!ctx.message.reply_to_message) return;

      const match = ctx.message.text.match(KARMA_REGEX);
      if (!match) return;

      const sender = ctx.from;
      const receiver = ctx.message.reply_to_message.from;
      if (!receiver) return;

      if (receiver.id === sender.id) {
        this.logger.warn(
          `User ${sender.id} tried to give karma to themselves.`,
        );
        return;
      }
      if (receiver.is_bot) {
        await ctx.telegram.sendMessage(
          ctx.chat.id,
          'You cannot give karma to bots.',
          {
            reply_parameters: { message_id: ctx.message.message_id },
          },
        );
        return;
      }

      const now = Date.now();
      const lastGivenTime = karmaCooldowns[sender.id];
      if (lastGivenTime && now - lastGivenTime < KARMA_COOLDOWN_MS) {
        const timeLeft = Math.ceil(
          (KARMA_COOLDOWN_MS - (now - lastGivenTime)) / 1000,
        );
        await ctx.telegram.sendMessage(
          ctx.chat.id,
          `Please wait ${timeLeft} seconds before giving karma again.`,
          {
            reply_parameters: { message_id: ctx.message.message_id },
          },
        );
        return;
      }

      try {
        const karmaValue = match[2] === '+' ? 1 : -1;
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
    });

    this.bot.on(message('text'), async (ctx) => {
      if (!ctx.message.text.startsWith('/')) return;

      for (const handler of this.commandHandlers.values()) {
        const command =
          typeof handler.command === 'string'
            ? `/${handler.command}`
            : handler.command;
        if (ctx.message.text.match(command)) {
          await handler.handle(ctx);
          return;
        }
      }
    });
  }

  private registerCommand(handler: ICommandHandler) {
    const key = handler.command.toString();
    this.commandHandlers.set(key, handler);
    this.logger.log(`Command registered: ${key}`);
  }

  onApplicationShutdown(signal: string) {
    if (this.bot) {
      this.bot.stop(signal);
    }
  }
}
