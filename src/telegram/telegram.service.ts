import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
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
import { StartCommandHandler } from './commands/handlers/start.command.handler';
import { SettingsCommandHandler } from './commands/handlers/settings.command.handler';
import { MessageQueueService } from './shared/message-queue.service';
import { KarmaMessageHandler } from './handlers/karma-message.handler';
import { isTextCommandHandler, TextCommandContext } from './telegram.types';

@Injectable()
export class TelegramService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf<Context<Update>>;

  private readonly commandHandlers = new Map<
    string | RegExp,
    ICommandHandler<any>
  >();

  constructor(
    private readonly configService: ConfigService,
    private readonly karmaMessageHandler: KarmaMessageHandler,
    private readonly messageQueueService: MessageQueueService,
    startHandler: StartCommandHandler,
    settingsHandler: SettingsCommandHandler,
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
    this.registerCommand(startHandler);
    this.registerCommand(settingsHandler);
    this.registerCommand(meHandler);
    this.registerCommand(topHandler);
    this.registerCommand(hateHandler);
    this.registerCommand(mostGiversHandler);
    this.registerCommand(helpHandler);
    this.registerCommand(getKarmaHandler);
    this.registerCommand(sendHandler);
    this.registerCommand(historyHandler);
    this.registerCommand(getHistoryHandler);
    this.registerCommand(topReceivedHandler);
  }

  onModuleInit() {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.bot = new Telegraf(botToken!);

    this.registerListeners();
    this.registerHandlerCallbacks();

    this.bot.launch().catch((err) => {
      this.logger.error('Failed to launch the bot', err);
    });

    this.messageQueueService.registerBot(this.bot);

    this.logger.log('Telegram Bot started successfully.');
  }

  private registerListeners() {
    this.bot.on(message('text'), async (ctx) => {
      if (ctx.message.text.startsWith('/')) {
        await this.handleCommand(ctx as unknown as TextCommandContext);
        return;
      }

      if (this.karmaMessageHandler.isApplicable(ctx.message.text)) {
        await this.karmaMessageHandler.handle(
          ctx as unknown as TextCommandContext,
        );
        return;
      }
    });
  }

  private async handleCommand(ctx: TextCommandContext) {
    for (const handler of this.commandHandlers.values()) {
      const command = this.getCommandHandler(handler);

      if (ctx.message.text.match(command) && isTextCommandHandler(handler)) {
        await handler.handle(ctx);
        return;
      }
    }
  }

  private registerCommand(handler: ICommandHandler<any>) {
    this.commandHandlers.set(handler.command, handler);
    this.logger.log(`Command registered: ${handler.command}`);
  }

  private registerHandlerCallbacks() {
    for (const handler of this.commandHandlers.values()) {
      handler.register?.(this.bot);
    }
  }

  private getCommandHandler(handler: ICommandHandler<any>) {
    return typeof handler.command === 'string'
      ? `/${handler.command}`
      : handler.command;
  }

  onApplicationShutdown(signal: string) {
    if (this.bot) {
      this.bot.stop(signal);
    }
  }
}
