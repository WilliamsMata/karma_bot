import { Module } from '@nestjs/common';
import { KarmaModule } from '../../karma/karma.module';
import { GroupsModule } from '../../groups/groups.module';
import { MeCommandHandler } from './handlers/me.command.handler';
import { TopCommandHandler } from './handlers/top.command.handler';
import { HateCommandHandler } from './handlers/hate.command.handler';
import { MostGiversCommandHandler } from './handlers/mostgivers.command.handler';
import { HelpCommandHandler } from './handlers/help.command.handler';
import { GetKarmaCommandHandler } from './handlers/getkarma.command.handler';
import { SendCommandHandler } from './handlers/send.command.handler';
import { HistoryCommandHandler } from './handlers/history.command.handler';
import { GetHistoryCommandHandler } from './handlers/gethistory.command.handler';
import { TopReceivedCommandHandler } from './handlers/top-received.command.handler';
import { StartCommandHandler } from './handlers/start.command.handler';
import { SettingsCommandHandler } from './handlers/settings.command.handler';
import { TelegramSharedModule } from '../shared/telegram-shared.module';

export const commandHandlers = [
  MeCommandHandler,
  TopCommandHandler,
  HateCommandHandler,
  MostGiversCommandHandler,
  HelpCommandHandler,
  GetKarmaCommandHandler,
  SendCommandHandler,
  HistoryCommandHandler,
  GetHistoryCommandHandler,
  TopReceivedCommandHandler,
  StartCommandHandler,
  SettingsCommandHandler,
];

@Module({
  imports: [KarmaModule, GroupsModule, TelegramSharedModule],
  providers: [...commandHandlers],
  exports: [...commandHandlers],
})
export class CommandsModule {}
