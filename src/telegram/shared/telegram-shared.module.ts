import { Module } from '@nestjs/common';
import { TelegramKeyboardService } from './telegram-keyboard.service';
import { TelegramLanguageService } from './telegram-language.service';
import { GroupsModule } from '../../groups/groups.module';

@Module({
  imports: [GroupsModule],
  providers: [TelegramKeyboardService, TelegramLanguageService],
  exports: [TelegramKeyboardService, TelegramLanguageService],
})
export class TelegramSharedModule {}
