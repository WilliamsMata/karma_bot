import { Inject, Logger } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { TelegramLanguageService } from '../../shared/telegram-language.service';
import { MessageQueueService } from '../../shared/message-queue.service';
import {
  GroupSettingsService,
  DEFAULT_LANGUAGE,
  SupportedLanguage,
} from '../../../groups/group-settings.service';
import { ICommandHandler } from '../command.interface';
import { TextCommandContext } from '../../telegram.types';
import { TelegramGuard } from '../../guards';

export abstract class BaseKarmaCommandHandler implements ICommandHandler {
  @Inject(KarmaService)
  protected readonly karmaService: KarmaService;

  @Inject(TelegramKeyboardService)
  protected readonly keyboardService: TelegramKeyboardService;

  @Inject(TelegramLanguageService)
  protected readonly languageService: TelegramLanguageService;

  @Inject(MessageQueueService)
  protected readonly messageQueueService: MessageQueueService;

  @Inject(GroupSettingsService)
  protected readonly groupSettingsService: GroupSettingsService;

  abstract command: string | RegExp;
  protected guards: TelegramGuard[] = [];
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  async handle(ctx: TextCommandContext): Promise<void> {
    try {
      await this.enrichContext(ctx);

      const guardPassed = await this.runGuards(ctx);
      if (!guardPassed) return;

      await this.execute(ctx);
    } catch (error) {
      this.logger.error(`Error handling command ${this.command}`, error);
    }
  }

  protected abstract execute(ctx: TextCommandContext): Promise<void>;

  private async enrichContext(ctx: TextCommandContext): Promise<void> {
    const chat = ctx.chat;
    if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {
      try {
        const settings = await this.groupSettingsService.ensureDefaults(
          chat.id,
        );
        ctx.groupSettings = settings;
        ctx.language =
          (settings.language as SupportedLanguage) || DEFAULT_LANGUAGE;
      } catch (e) {
        this.logger.error('Failed to load group settings', e);
        ctx.language = DEFAULT_LANGUAGE;
      }
    } else {
      ctx.language = this.languageService.resolveLanguageFromUser(ctx.from);
    }
  }

  private async runGuards(ctx: TextCommandContext): Promise<boolean> {
    for (const guard of this.guards) {
      const canActivate = await guard.canActivate(ctx);
      if (!canActivate) {
        if (guard.getErrorMessage) {
          const message = guard.getErrorMessage(ctx.language);
          if (message) {
            this.messageQueueService.addMessage(ctx.chat.id, message);
          }
        }
        return false;
      }
    }
    return true;
  }
}
