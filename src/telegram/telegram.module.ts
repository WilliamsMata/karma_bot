import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { KarmaModule } from '../karma/karma.module';
import { commandHandlers, CommandsModule } from './commands/commands.module';
import { TelegramKeyboardService } from './telegram-keyboard.service';

@Module({
  imports: [KarmaModule, CommandsModule],
  providers: [TelegramService, TelegramKeyboardService, ...commandHandlers],
  exports: [TelegramService],
})
export class TelegramModule {}
