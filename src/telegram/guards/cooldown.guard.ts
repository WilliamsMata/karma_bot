import NodeCache from 'node-cache';
import { TelegramGuard } from './telegram.guard';
import { TextCommandContext } from '../telegram.types';
import {
  SupportedLanguage,
  DEFAULT_COOLDOWN_SECONDS,
} from '../../groups/group-settings.service';
import { MessageQueueService } from '../shared/message-queue.service';

export class CooldownGuard implements TelegramGuard {
  constructor(
    private readonly cache: NodeCache,
    private readonly messageQueueService: MessageQueueService,
    private readonly errorMessageBuilder: (
      lang: SupportedLanguage,
      context: { secondsLeft: number },
    ) => string,
  ) {}

  canActivate(ctx: TextCommandContext): boolean {
    const chatId = ctx.chat.id;
    const senderId = ctx.from.id;
    const cacheKey = `${chatId}:${senderId}`;

    if (this.cache.get(cacheKey)) {
      const ttl = this.cache.getTtl(cacheKey);
      const cooldownSeconds =
        ctx.groupSettings?.cooldownSeconds ?? DEFAULT_COOLDOWN_SECONDS;
      const secondsLeft = Math.max(
        1,
        ttl ? Math.ceil((ttl - Date.now()) / 1000) : cooldownSeconds,
      );

      const message = this.errorMessageBuilder(ctx.language, { secondsLeft });
      this.messageQueueService.addMessage(chatId, message);
      return false;
    }
    return true;
  }
}
