import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { KarmaModule } from '../karma/karma.module';
import { CommandsModule } from './commands/commands.module';
import { KarmaMessageHandler } from './handlers/karma-message.handler';
import { TelegramSharedModule } from './shared/telegram-shared.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [KarmaModule, CommandsModule, TelegramSharedModule, GroupsModule],
  providers: [TelegramService, KarmaMessageHandler],
  exports: [TelegramService],
})
export class TelegramModule {}
