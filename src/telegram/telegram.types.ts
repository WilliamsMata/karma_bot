import { Context } from 'telegraf';
import { Update, Message } from 'telegraf/types';
import { ICommandHandler } from './commands/command.interface';
import { SupportedLanguage } from '../groups/group-settings.service';
import { GroupSettings } from '../groups/schemas/group-settings.schema';

export type TextCommandContext = Context<
  Update.MessageUpdate<Message.TextMessage>
> & {
  match?: RegExpMatchArray;
  // Extended properties for the bot
  language: SupportedLanguage;
  groupSettings?: GroupSettings;
};

export type ITextCommandHandler = ICommandHandler<
  Update.MessageUpdate<Message.TextMessage>
>;

export const isTextCommandHandler = (
  handler: ICommandHandler<any>,
): handler is ITextCommandHandler => {
  return (
    typeof handler.command === 'string' || handler.command instanceof RegExp
  );
};
