import { Injectable, Logger } from '@nestjs/common';
import { Markup, Telegraf, Context as TelegrafContext } from 'telegraf';
import {
  ChatMember,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from 'telegraf/types';
import type { Update } from 'telegraf/types';
import { GroupsService } from '../../../groups/groups.service';
import {
  GroupSettingsService,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../../../groups/group-settings.service';
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
const SETTINGS_MENU_LANGUAGE = 'settings:menu:language';
const SETTINGS_CLOSE = 'settings:close';
const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  ru: 'Русский',
  fa: 'فارسی',
};

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

    bot.action(SETTINGS_MENU_LANGUAGE, async (ctx) => {
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

      const currentLanguage =
        await this.groupSettingsService.getLanguage(chatId);

      try {
        await ctx.editMessageText(
          this.buildLanguageMenuMessage(currentLanguage),
          this.buildEditExtra(this.buildLanguageKeyboard(currentLanguage)),
        );
      } catch (error) {
        this.logger.error('Failed to render language menu', error);
      }

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

    bot.action(/^settings:language:([a-z]{2})$/, async (ctx) => {
      const languageCode = ctx.match[1] as SupportedLanguage;
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

      if (!SUPPORTED_LANGUAGES.includes(languageCode)) {
        await ctx.answerCbQuery('Unsupported language selected.', {
          show_alert: true,
        });
        return;
      }

      await this.groupSettingsService.updateLanguage(chatId, languageCode);

      await ctx.answerCbQuery(
        `Language updated to ${LANGUAGE_LABELS[languageCode]}.`,
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

    const [cooldown, language] = await Promise.all([
      this.groupSettingsService.getCooldownSeconds(ctx.chat.id),
      this.groupSettingsService.getLanguage(ctx.chat.id),
    ]);

    await ctx.reply(
      this.buildMainMenuMessage(cooldown, language),
      this.buildReplyExtra(this.buildMainMenuKeyboard(language)),
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

  private buildMainMenuMessage(
    cooldownSeconds: number,
    language: SupportedLanguage,
  ): string {
    return (
      '⚙️ *Group Settings*\n\n' +
      `Current cooldown: *${cooldownSeconds} seconds*.\n\n` +
      `Language: *${LANGUAGE_LABELS[language]}*.\n\n` +
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

  private buildLanguageMenuMessage(currentLanguage: SupportedLanguage): string {
    return (
      '⚙️ *Group Settings*\n\n' +
      `Current language: *${LANGUAGE_LABELS[currentLanguage]}*.\n\n` +
      'Choose a new language:'
    );
  }

  private buildMainMenuKeyboard(
    language: SupportedLanguage,
  ): InlineKeyboardMarkup {
    return Markup.inlineKeyboard([
      [Markup.button.callback('⏱️ Cooldown', SETTINGS_MENU_COOLDOWN)],
      [
        Markup.button.callback(
          `🌐 Language (${LANGUAGE_LABELS[language]})`,
          SETTINGS_MENU_LANGUAGE,
        ),
      ],
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

  private buildLanguageKeyboard(
    currentLanguage: SupportedLanguage,
  ): InlineKeyboardMarkup {
    const optionButtons = SUPPORTED_LANGUAGES.map((language) =>
      Markup.button.callback(
        `${language === currentLanguage ? '• ' : ''}${LANGUAGE_LABELS[language]}`,
        `settings:language:${language}`,
      ),
    );

    const inlineKeyboard: InlineKeyboardButton[][] = [];
    for (let i = 0; i < optionButtons.length; i += 2) {
      inlineKeyboard.push(optionButtons.slice(i, i + 2));
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
    const [cooldown, language] = await Promise.all([
      this.groupSettingsService.getCooldownSeconds(chatId),
      this.groupSettingsService.getLanguage(chatId),
    ]);

    await ctx.editMessageText(
      this.buildMainMenuMessage(cooldown, language),
      this.buildEditExtra(this.buildMainMenuKeyboard(language)),
    );
  }
}
