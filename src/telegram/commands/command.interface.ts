import { Context } from 'telegraf';
import { Update } from 'telegraf/types';

export interface ICommandHandler<T extends Update = Update> {
  command: string | RegExp;
  handle(ctx: Context<T>): Promise<void>;
}
