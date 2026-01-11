import { TelegramGuard } from './telegram.guard';
import { TextCommandContext } from '../telegram.types';
import { SupportedLanguage } from '../../groups/group-settings.service';

export class BotInteractionGuard implements TelegramGuard {
  constructor(
    private readonly errorMessageBuilder?: (lang: SupportedLanguage) => string,
  ) {}

  canActivate(ctx: TextCommandContext): boolean {
    const receiver = ctx.message?.reply_to_message?.from;

    if (!receiver) {
      return true; // Let ReplyRequiredGuard handle this
    }

    return !receiver.is_bot;
  }

  getErrorMessage(language: SupportedLanguage): string {
    return this.errorMessageBuilder ? this.errorMessageBuilder(language) : '';
  }
}
