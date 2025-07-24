import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { KarmaModule } from '../karma/karma.module';
import { commandHandlers, CommandsModule } from './commands/commands.module';

@Module({
  imports: [KarmaModule, CommandsModule],
  providers: [TelegramService, ...commandHandlers],
  exports: [TelegramService],
})
export class TelegramModule {}
