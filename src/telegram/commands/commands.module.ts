import { Module } from '@nestjs/common';
import { KarmaModule } from '../../karma/karma.module';
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
import { TelegramKeyboardService } from '../telegram-keyboard.service';

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
];

@Module({
  imports: [KarmaModule],
  providers: [TelegramKeyboardService, ...commandHandlers],
  exports: [...commandHandlers],
})
export class CommandsModule {}
