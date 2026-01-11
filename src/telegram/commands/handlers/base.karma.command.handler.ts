import { Inject } from '@nestjs/common';
import { KarmaService } from '../../../karma/karma.service';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { TelegramLanguageService } from '../../shared/telegram-language.service';
import { MessageQueueService } from '../../shared/message-queue.service';

export abstract class BaseKarmaCommandHandler {
  @Inject(KarmaService)
  protected readonly karmaService: KarmaService;

  @Inject(TelegramKeyboardService)
  protected readonly keyboardService: TelegramKeyboardService;

  @Inject(TelegramLanguageService)
  protected readonly languageService: TelegramLanguageService;

  @Inject(MessageQueueService)
  protected readonly messageQueueService: MessageQueueService;
}
