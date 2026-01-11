import { TelegramGuard } from './telegram.guard';
import { TextCommandContext } from '../telegram.types';
import { SupportedLanguage } from '../../groups/group-settings.service';

export class ReplyRequiredGuard implements TelegramGuard {
  constructor(
    private readonly errorMessageBuilder?: (lang: SupportedLanguage) => string,
  ) {}

  canActivate(ctx: TextCommandContext): boolean {
    return !!(
      ctx.message &&
      'reply_to_message' in ctx.message &&
      ctx.message.reply_to_message &&
      ctx.message.reply_to_message.from
    );
  }

  getErrorMessage(language: SupportedLanguage): string {
    return this.errorMessageBuilder ? this.errorMessageBuilder(language) : '';
  }
}
