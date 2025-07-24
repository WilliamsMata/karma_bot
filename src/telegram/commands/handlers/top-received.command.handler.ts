// src/telegram/commands/handlers/top-received.command.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { KarmaService } from '../../../karma/karma.service';
import { ICommandHandler } from '../command.interface';
import { Update } from 'telegraf/types';

@Injectable()
export class TopReceivedCommandHandler implements ICommandHandler {
  private readonly logger = new Logger(TopReceivedCommandHandler.name);
  // Esta RegExp captura cualquiera de los tres comandos.
  command = /^\/(today|month|year)/;

  constructor(private readonly karmaService: KarmaService) {}

  async handle(ctx: Context<Update>): Promise<void> {
    if (!ctx.chat || !ctx.message || !('text' in ctx.message)) return;

    const match = ctx.message.text.match(this.command);
    if (!match) return;

    const commandName = match[1]; // 'today', 'month', or 'year'
    let daysBack: number;
    let periodName: string;

    switch (commandName) {
      case 'today':
        daysBack = 1;
        periodName = 'last 24 hours';
        break;
      case 'month':
        daysBack = 30;
        periodName = 'last 30 days';
        break;
      case 'year':
        daysBack = 365;
        periodName = 'last 365 days';
        break;
      default:
        return;
    }

    try {
      const topUsers = await this.karmaService.getTopUsersByKarmaReceived(
        ctx.chat.id,
        daysBack,
        10,
      );

      if (topUsers.length === 0) {
        await ctx.reply(
          `No users received karma in the ${periodName} in this group.`,
        );
        return;
      }

      let message = `🌟 Top 10 users by karma received in the ${periodName}:\n\n`;
      topUsers.forEach((user, index) => {
        const name = user.userName ? `@${user.userName}` : user.firstName;
        message += `${index + 1}. ${name} received ${user.totalKarmaReceived} karma\n`;
      });

      await ctx.reply(message);
    } catch (error) {
      this.logger.error(`Error handling /${commandName}`, error);
      await ctx.reply(
        `Sorry, I couldn't retrieve the top users for the ${periodName}.`,
      );
    }
  }
}
