import { Injectable, Logger } from '@nestjs/common';
import { Markup, Telegraf, Context as TelegrafContext } from 'telegraf';
import {
  ChatMember,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from 'telegraf/types';
import type { Update } from 'telegraf/types';
import { GroupsService } from '../../../groups/groups.service';
import { GroupSettingsService } from '../../../groups/group-settings.service';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';
import {
  ExtraEditMessageText,
  ExtraReplyMessage,
} from 'telegraf/typings/telegram-types';

const COOLDOWN_OPTIONS = [30, 60, 120, 300, 600];
const SETTINGS_MENU_ROOT = 'settings:menu:main';
const SETTINGS_MENU_COOLDOWN = 'settings:menu:cooldown';
const SETTINGS_CLOSE = 'settings:close';

@Injectable()
export class SettingsCommandHandler implements ITextCommandHandler {
  command = 'settings';
  private readonly logger = new Logger(SettingsCommandHandler.name);

  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupSettingsService: GroupSettingsService,
  ) {}

  register(bot: Telegraf<TelegrafContext<Update>>) {
    bot.action(SETTINGS_MENU_COOLDOWN, async (ctx) => {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        await ctx.answerCbQuery('Chat not found.');
        return;
      }

      if (!(await this.userIsAdmin(ctx.telegram, chatId, ctx.from.id))) {
        await ctx.answerCbQuery('Only admins can change settings.', {
          show_alert: true,
        });
        return;
      }

      const currentCooldown =
        await this.groupSettingsService.getCooldownSeconds(chatId);

      try {
        await ctx.editMessageText(
          this.buildCooldownMenuMessage(currentCooldown),
          this.buildEditExtra(this.buildCooldownKeyboard()),
        );
      } catch (error) {
        this.logger.error('Failed to render cooldown menu', error);
      }

      await ctx.answerCbQuery();
    });

    bot.action(SETTINGS_MENU_ROOT, async (ctx) => {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        await ctx.answerCbQuery('Chat not found.');
        return;
      }

      if (!(await this.userIsAdmin(ctx.telegram, chatId, ctx.from.id))) {
        await ctx.answerCbQuery('Only admins can change settings.', {
          show_alert: true,
        });
        return;
      }

      await this.renderMainMenu(ctx, chatId);
      await ctx.answerCbQuery();
    });

    bot.action(/^settings:cooldown:(\d+)$/, async (ctx) => {
      const requestedCooldown = Number(ctx.match[1]);
      const chatId = ctx.chat?.id;

      if (!chatId) {
        await ctx.answerCbQuery('Chat not found.');
        return;
      }

      if (!(await this.userIsAdmin(ctx.telegram, chatId, ctx.from.id))) {
        await ctx.answerCbQuery('Only admins can change settings.', {
          show_alert: true,
        });
        return;
      }

      await this.groupSettingsService.updateCooldownSeconds(
        chatId,
        requestedCooldown,
      );

      await ctx.answerCbQuery(
        `Cooldown updated to ${requestedCooldown} seconds.`,
      );

      try {
        await this.renderMainMenu(ctx, chatId);
      } catch (error) {
        this.logger.error('Failed to edit settings message', error);
      }
    });

    bot.action(SETTINGS_CLOSE, async (ctx) => {
      try {
        await ctx.editMessageText(
          '✅ Settings updated. Use /settings to open this menu again.',
          { parse_mode: 'Markdown' },
        );
      } catch (error) {
        this.logger.warn('Failed to close settings message cleanly', error);
        await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
      }
      await ctx.answerCbQuery('Settings closed.');
    });
  }

  async handle(ctx: TextCommandContext): Promise<void> {
    if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
      await ctx.reply('This command is only available in group chats.');
      return;
    }

    const isAdmin = await this.userIsAdmin(
      ctx.telegram,
      ctx.chat.id,
      ctx.from.id,
    );
    if (!isAdmin) {
      await ctx.reply('Only group administrators can change settings.');
      return;
    }

    await this.groupsService.findOrCreate({
      id: ctx.chat.id,
      title: ctx.chat.title ?? `Group ${ctx.chat.id}`,
    });

    const settings = await this.groupSettingsService.getCooldownSeconds(
      ctx.chat.id,
    );

    await ctx.reply(
      this.buildMainMenuMessage(settings),
      this.buildReplyExtra(this.buildMainMenuKeyboard()),
    );
  }

  private async userIsAdmin(
    telegram: Telegraf['telegram'],
    chatId: number,
    userId: number,
  ): Promise<boolean> {
    let member: ChatMember | undefined;
    try {
      member = await telegram.getChatMember(chatId, userId);
    } catch (error) {
      this.logger.warn(
        `Failed to get chat member for ${userId} in ${chatId}`,
        error,
      );
      return false;
    }

    return member.status === 'administrator' || member.status === 'creator';
  }

  private buildMainMenuMessage(cooldownSeconds: number): string {
    return (
      '⚙️ *Group Settings*\n\n' +
      `Current cooldown: *${cooldownSeconds} seconds*.\n\n` +
      'Choose a configuration to modify:'
    );
  }

  private buildCooldownMenuMessage(currentCooldown: number): string {
    return (
      '⚙️ *Group Settings*\n\n' +
      `Current cooldown: *${currentCooldown} seconds*.\n\n` +
      'Choose a new cooldown duration:'
    );
  }

  private buildMainMenuKeyboard(): InlineKeyboardMarkup {
    return Markup.inlineKeyboard([
      [Markup.button.callback('⏱️ Cooldown', SETTINGS_MENU_COOLDOWN)],
      [Markup.button.callback('✅ All set', SETTINGS_CLOSE)],
    ]).reply_markup;
  }

  private buildCooldownKeyboard(): InlineKeyboardMarkup {
    const optionButtons = COOLDOWN_OPTIONS.map((seconds) =>
      Markup.button.callback(`${seconds}s`, `settings:cooldown:${seconds}`),
    );

    const inlineKeyboard: InlineKeyboardButton[][] = [];
    for (let i = 0; i < optionButtons.length; i += 3) {
      inlineKeyboard.push(optionButtons.slice(i, i + 3));
    }

    inlineKeyboard.push([
      Markup.button.callback('⬅️ Back', SETTINGS_MENU_ROOT),
      Markup.button.callback('✅ All set', SETTINGS_CLOSE),
    ]);

    return Markup.inlineKeyboard(inlineKeyboard).reply_markup;
  }

  private buildReplyExtra(keyboard: InlineKeyboardMarkup): ExtraReplyMessage {
    const extra: ExtraReplyMessage = { parse_mode: 'Markdown' };
    extra.reply_markup = keyboard;
    return extra;
  }

  private buildEditExtra(keyboard: InlineKeyboardMarkup): ExtraEditMessageText {
    const extra: ExtraEditMessageText = { parse_mode: 'Markdown' };
    extra.reply_markup = keyboard;
    return extra;
  }

  private async renderMainMenu(
    ctx: TelegrafContext<Update>,
    chatId: number,
  ): Promise<void> {
    const currentCooldown =
      await this.groupSettingsService.getCooldownSeconds(chatId);

    await ctx.editMessageText(
      this.buildMainMenuMessage(currentCooldown),
      this.buildEditExtra(this.buildMainMenuKeyboard()),
    );
  }
}
