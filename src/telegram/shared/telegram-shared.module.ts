import { Module } from '@nestjs/common';
import { TelegramKeyboardService } from './telegram-keyboard.service';

@Module({
  imports: [],
  providers: [TelegramKeyboardService],
  exports: [TelegramKeyboardService],
})
export class TelegramSharedModule {}
