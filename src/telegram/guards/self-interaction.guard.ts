import { TelegramGuard } from './telegram.guard';
import { TextCommandContext } from '../telegram.types';
import { SupportedLanguage } from '../../groups/group-settings.service';

export class SelfInteractionGuard implements TelegramGuard {
  constructor(
    private readonly errorMessageBuilder?: (lang: SupportedLanguage) => string,
  ) {}

  canActivate(ctx: TextCommandContext): boolean {
    const sender = ctx.from;
    const receiver = ctx.message?.reply_to_message?.from;

    if (!sender || !receiver) {
      return true; // Let ReplyRequiredGuard handle this
    }

    return sender.id !== receiver.id;
  }

  getErrorMessage(language: SupportedLanguage): string {
    return this.errorMessageBuilder ? this.errorMessageBuilder(language) : '';
  }
}
