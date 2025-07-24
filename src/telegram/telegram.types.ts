import { Context } from 'telegraf';
import { Update, Message } from 'telegraf/types';
import { ICommandHandler } from './commands/command.interface';

export type TextCommandContext = Context<
  Update.MessageUpdate<Message.TextMessage>
>;

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
