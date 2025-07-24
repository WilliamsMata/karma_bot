import { Context } from 'telegraf';
import { Update } from 'telegraf/types';

export interface ICommandHandler {
  /**
   * El nombre del comando (sin el '/').
   * Puede ser una RegExp para comandos complejos con argumentos.
   */
  command: string | RegExp;

  /**
   * El método que se ejecuta cuando se invoca el comando.
   * @param ctx El contexto de Telegraf.
   */
  handle(ctx: Context<Update>): Promise<void>;
}
