import { Context } from 'telegraf';
import { Update } from 'telegraf/types';

export interface ICommandHandler {
  command: string | RegExp;
  handle(ctx: Context<Update>): Promise<void>;
}
