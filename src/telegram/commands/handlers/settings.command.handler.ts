import { Injectable, Logger } from '@nestjs/common';
import { Context as TelegrafContext, Markup, Telegraf } from 'telegraf';
import { ChatMember, InlineKeyboardMarkup } from 'telegraf/types';
import type { Update } from 'telegraf/types';
import {
  ExtraEditMessageText,
  ExtraReplyMessage,
} from 'telegraf/typings/telegram-types';
import { GroupsService } from '../../../groups/groups.service';
import {
  GroupSettingsService,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../../../groups/group-settings.service';
import {
  buildSettingsAdminOnlyMessage,
  buildSettingsBackButtonLabel,
  buildSettingsChatNotFoundMessage,
  buildSettingsCloseMessage,
  buildSettingsCloseNotification,
  buildSettingsCooldownButtonLabel,
  buildSettingsCooldownMenuMessage,
  buildSettingsCooldownOptionLabel,
  buildSettingsCooldownUpdatedMessage,
  buildSettingsConfirmButtonLabel,
  buildSettingsGroupOnlyMessage,
  buildSettingsLanguageButtonLabel,
  buildSettingsLanguageMenuMessage,
  buildSettingsLanguageUpdatedMessage,
  buildSettingsMainMenuMessage,
  buildSettingsUnsupportedLanguageMessage,
  resolveSettingsLanguageLabel,
} from '../../dictionary/settings.dictionary';
import { TelegramLanguageService } from '../../shared/telegram-language.service';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';

const COOLDOWN_OPTIONS = [30, 60, 120, 300, 600];
const SETTINGS_MENU_ROOT = 'settings:menu:main';
const SETTINGS_MENU_COOLDOWN = 'settings:menu:cooldown';
const SETTINGS_MENU_LANGUAGE = 'settings:menu:language';
const SETTINGS_CLOSE = 'settings:close';

@Injectable()
export class SettingsCommandHandler implements ITextCommandHandler {
  command = 'settings';
  private readonly logger = new Logger(SettingsCommandHandler.name);

  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupSettingsService: GroupSettingsService,
    private readonly languageService: TelegramLanguageService,
  ) {}

  register(bot: Telegraf<TelegrafContext<Update>>) {
    bot.action(SETTINGS_MENU_ROOT, async (ctx) => {
      const chatId = ctx.chat?.id;
      const userLanguage = this.languageService.resolveLanguageFromUser(
        ctx.from,
      );

      if (!chatId) {
        await ctx.answerCbQuery(buildSettingsChatNotFoundMessage(userLanguage));
        return;
      }

      if (!(await this.userIsAdmin(ctx.telegram, chatId, ctx.from.id))) {
        await ctx.answerCbQuery(buildSettingsAdminOnlyMessage(userLanguage), {
          show_alert: true,
        });
        return;
      }

      await this.renderMainMenu(ctx, chatId, userLanguage);
      await ctx.answerCbQuery();
    });

    bot.action(SETTINGS_MENU_COOLDOWN, async (ctx) => {
      const chatId = ctx.chat?.id;
      const userLanguage = this.languageService.resolveLanguageFromUser(
        ctx.from,
      );

      if (!chatId) {
        await ctx.answerCbQuery(buildSettingsChatNotFoundMessage(userLanguage));
        return;
      }

      if (!(await this.userIsAdmin(ctx.telegram, chatId, ctx.from.id))) {
        await ctx.answerCbQuery(buildSettingsAdminOnlyMessage(userLanguage), {
          show_alert: true,
        });
        return;
      }

      const currentCooldown =
        await this.groupSettingsService.getCooldownSeconds(chatId);

      try {
        await ctx.editMessageText(
          buildSettingsCooldownMenuMessage(userLanguage, {
            currentCooldown,
          }),
          this.buildEditExtra(this.buildCooldownKeyboard(userLanguage)),
        );
      } catch (error) {
        this.logger.error('Failed to render cooldown menu', error);
      }

      await ctx.answerCbQuery();
    });

    bot.action(SETTINGS_MENU_LANGUAGE, async (ctx) => {
      const chatId = ctx.chat?.id;
      const userLanguage = this.languageService.resolveLanguageFromUser(
        ctx.from,
      );

      if (!chatId) {
        await ctx.answerCbQuery(buildSettingsChatNotFoundMessage(userLanguage));
        return;
      }

      if (!(await this.userIsAdmin(ctx.telegram, chatId, ctx.from.id))) {
        await ctx.answerCbQuery(buildSettingsAdminOnlyMessage(userLanguage), {
          show_alert: true,
        });
        return;
      }

      const currentLanguage =
        await this.groupSettingsService.getLanguage(chatId);
      const currentLanguageLabel = resolveSettingsLanguageLabel(
        currentLanguage,
        userLanguage,
      );

      try {
        await ctx.editMessageText(
          buildSettingsLanguageMenuMessage(userLanguage, {
            currentLanguageLabel,
          }),
          this.buildEditExtra(
            this.buildLanguageKeyboard(userLanguage, currentLanguage),
          ),
        );
      } catch (error) {
        this.logger.error('Failed to render language menu', error);
      }

      await ctx.answerCbQuery();
    });

    bot.action(/^settings:cooldown:(\d+)$/, async (ctx) => {
      const requestedCooldown = Number(ctx.match[1]);
      const chatId = ctx.chat?.id;
      const userLanguage = this.languageService.resolveLanguageFromUser(
        ctx.from,
      );

      if (!chatId) {
        await ctx.answerCbQuery(buildSettingsChatNotFoundMessage(userLanguage));
        return;
      }

      if (!(await this.userIsAdmin(ctx.telegram, chatId, ctx.from.id))) {
        await ctx.answerCbQuery(buildSettingsAdminOnlyMessage(userLanguage), {
          show_alert: true,
        });
        return;
      }

      await this.groupSettingsService.updateCooldownSeconds(
        chatId,
        requestedCooldown,
      );

      await ctx.answerCbQuery(
        buildSettingsCooldownUpdatedMessage(userLanguage, {
          cooldownSeconds: requestedCooldown,
        }),
      );

      try {
        await this.renderMainMenu(ctx, chatId, userLanguage);
      } catch (error) {
        this.logger.error('Failed to edit settings message', error);
      }
    });

    bot.action(/^settings:language:([a-z]{2})$/, async (ctx) => {
      const languageCode = ctx.match[1] as SupportedLanguage;
      const chatId = ctx.chat?.id;
      const userLanguage = this.languageService.resolveLanguageFromUser(
        ctx.from,
      );

      if (!chatId) {
        await ctx.answerCbQuery(buildSettingsChatNotFoundMessage(userLanguage));
        return;
      }

      if (!(await this.userIsAdmin(ctx.telegram, chatId, ctx.from.id))) {
        await ctx.answerCbQuery(buildSettingsAdminOnlyMessage(userLanguage), {
          show_alert: true,
        });
        return;
      }

      if (!SUPPORTED_LANGUAGES.includes(languageCode)) {
        await ctx.answerCbQuery(
          buildSettingsUnsupportedLanguageMessage(userLanguage),
          {
            show_alert: true,
          },
        );
        return;
      }

      await this.groupSettingsService.updateLanguage(chatId, languageCode);

      const languageLabel = resolveSettingsLanguageLabel(
        languageCode,
        userLanguage,
      );

      await ctx.answerCbQuery(
        buildSettingsLanguageUpdatedMessage(userLanguage, {
          languageLabel,
        }),
      );

      try {
        await this.renderMainMenu(ctx, chatId, userLanguage);
      } catch (error) {
        this.logger.error('Failed to edit settings message', error);
      }
    });

    bot.action(SETTINGS_CLOSE, async (ctx) => {
      const userLanguage = this.languageService.resolveLanguageFromUser(
        ctx.from,
      );
      const chatId = ctx.chat?.id;

      if (!chatId) {
        await ctx.answerCbQuery(buildSettingsChatNotFoundMessage(userLanguage));
        return;
      }

      if (!(await this.userIsAdmin(ctx.telegram, chatId, ctx.from.id))) {
        await ctx.answerCbQuery(buildSettingsAdminOnlyMessage(userLanguage), {
          show_alert: true,
        });
        return;
      }

      try {
        await ctx.editMessageText(buildSettingsCloseMessage(userLanguage), {
          parse_mode: 'Markdown',
        });
      } catch (error) {
        this.logger.warn('Failed to close settings message cleanly', error);
        await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
      }

      await ctx.answerCbQuery(buildSettingsCloseNotification(userLanguage));
    });
  }

  async handle(ctx: TextCommandContext): Promise<void> {
    const userLanguage = this.languageService.resolveLanguageFromUser(ctx.from);

    if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
      await ctx.reply(buildSettingsGroupOnlyMessage(userLanguage));
      return;
    }

    const isAdmin = await this.userIsAdmin(
      ctx.telegram,
      ctx.chat.id,
      ctx.from.id,
    );

    if (!isAdmin) {
      await ctx.reply(buildSettingsAdminOnlyMessage(userLanguage));
      return;
    }

    await this.groupsService.findOrCreate({
      id: ctx.chat.id,
      title: ctx.chat.title ?? `Group ${ctx.chat.id}`,
    });

    const [cooldown, groupLanguage] = await Promise.all([
      this.groupSettingsService.getCooldownSeconds(ctx.chat.id),
      this.groupSettingsService.getLanguage(ctx.chat.id),
    ]);

    const languageLabel = resolveSettingsLanguageLabel(
      groupLanguage,
      userLanguage,
    );

    await ctx.reply(
      buildSettingsMainMenuMessage(userLanguage, {
        cooldownSeconds: cooldown,
        languageLabel,
      }),
      this.buildReplyExtra(
        this.buildMainMenuKeyboard(userLanguage, groupLanguage),
      ),
    );
  }

  private async renderMainMenu(
    ctx: TelegrafContext<Update>,
    chatId: number,
    userLanguage: SupportedLanguage,
  ) {
    try {
      const [cooldown, groupLanguage] = await Promise.all([
        this.groupSettingsService.getCooldownSeconds(chatId),
        this.groupSettingsService.getLanguage(chatId),
      ]);

      const languageLabel = resolveSettingsLanguageLabel(
        groupLanguage,
        userLanguage,
      );

      await ctx.editMessageText(
        buildSettingsMainMenuMessage(userLanguage, {
          cooldownSeconds: cooldown,
          languageLabel,
        }),
        this.buildEditExtra(
          this.buildMainMenuKeyboard(userLanguage, groupLanguage),
        ),
      );
    } catch (error) {
      this.logger.error('Failed to render main menu', error);
    }
  }

  private buildMainMenuKeyboard(
    userLanguage: SupportedLanguage,
    activeLanguage: SupportedLanguage,
  ): InlineKeyboardMarkup {
    const languageLabel = resolveSettingsLanguageLabel(
      activeLanguage,
      userLanguage,
    );

    return Markup.inlineKeyboard([
      [
        Markup.button.callback(
          buildSettingsCooldownButtonLabel(userLanguage),
          SETTINGS_MENU_COOLDOWN,
        ),
        Markup.button.callback(
          buildSettingsLanguageButtonLabel(userLanguage, {
            languageLabel,
          }),
          SETTINGS_MENU_LANGUAGE,
        ),
      ],
      [
        Markup.button.callback(
          buildSettingsConfirmButtonLabel(userLanguage),
          SETTINGS_CLOSE,
        ),
      ],
    ]).reply_markup;
  }

  private buildCooldownKeyboard(
    userLanguage: SupportedLanguage,
  ): InlineKeyboardMarkup {
    const rows = COOLDOWN_OPTIONS.map((seconds) => [
      Markup.button.callback(
        buildSettingsCooldownOptionLabel(userLanguage, {
          seconds,
        }),
        `settings:cooldown:${seconds}`,
      ),
    ]);

    rows.push([
      Markup.button.callback(
        buildSettingsBackButtonLabel(userLanguage),
        SETTINGS_MENU_ROOT,
      ),
    ]);

    return Markup.inlineKeyboard(rows).reply_markup;
  }

  private buildLanguageKeyboard(
    userLanguage: SupportedLanguage,
    currentLanguage: SupportedLanguage,
  ): InlineKeyboardMarkup {
    const rows = SUPPORTED_LANGUAGES.map((language) => {
      const languageLabel = resolveSettingsLanguageLabel(
        language,
        userLanguage,
      );
      const prefix = language === currentLanguage ? '✅ ' : '';
      return [
        Markup.button.callback(
          `${prefix}${languageLabel}`,
          `settings:language:${language}`,
        ),
      ];
    });

    rows.push([
      Markup.button.callback(
        buildSettingsBackButtonLabel(userLanguage),
        SETTINGS_MENU_ROOT,
      ),
    ]);

    return Markup.inlineKeyboard(rows).reply_markup;
  }

  private buildReplyExtra(
    replyMarkup: InlineKeyboardMarkup,
  ): ExtraReplyMessage {
    return {
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    };
  }

  private buildEditExtra(
    replyMarkup: InlineKeyboardMarkup,
  ): ExtraEditMessageText {
    return {
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    };
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
}
