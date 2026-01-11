import { Module } from '@nestjs/common';
import { TelegramKeyboardService } from './telegram-keyboard.service';
import { TelegramLanguageService } from './telegram-language.service';
import { MessageQueueService } from './message-queue.service';
import { GroupsModule } from '../../groups/groups.module';

@Module({
  imports: [GroupsModule],
  providers: [
    TelegramKeyboardService,
    TelegramLanguageService,
    MessageQueueService,
  ],
  exports: [
    TelegramKeyboardService,
    TelegramLanguageService,
    MessageQueueService,
  ],
})
export class TelegramSharedModule {}
