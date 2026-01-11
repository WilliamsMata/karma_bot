import { TextCommandContext } from '../telegram.types';
import { SupportedLanguage } from '../../groups/group-settings.service';

export interface TelegramGuard {
  canActivate(ctx: TextCommandContext): Promise<boolean> | boolean;
  getErrorMessage?(language: SupportedLanguage): string;
}
