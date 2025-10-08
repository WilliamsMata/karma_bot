import { Injectable } from '@nestjs/common';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  DEFAULT_COOLDOWN_SECONDS,
  DEFAULT_LANGUAGE,
  GroupSettingsService,
  SupportedLanguage,
} from '../../../groups/group-settings.service';
import { buildHelpMessage } from '../../dictionary/help.dictionary';
import {
  ITextCommandHandler,
  TextCommandContext,
} from 'src/telegram/telegram.types';

@Injectable()
export class HelpCommandHandler implements ITextCommandHandler {
  command = 'help';

  constructor(
    private readonly keyboardService: TelegramKeyboardService,
    private readonly groupSettingsService: GroupSettingsService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const keyboard = this.keyboardService.getGroupWebAppKeyboard(ctx.chat);

    const extra: ExtraReplyMessage = {};
    extra.parse_mode = 'Markdown';
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    let cooldownSeconds = DEFAULT_COOLDOWN_SECONDS;
    let language: SupportedLanguage = DEFAULT_LANGUAGE;

    const chatId = ctx.chat?.id;
    if (typeof chatId === 'number') {
      if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        await this.groupSettingsService.ensureDefaults(chatId);
      }

      const [fetchedCooldown, fetchedLanguage] = await Promise.all([
        this.groupSettingsService.getCooldownSeconds(chatId),
        this.groupSettingsService.getLanguage(chatId),
      ]);

      cooldownSeconds = fetchedCooldown;
      language = fetchedLanguage;
    }

    const helpMessage = buildHelpMessage(language, { cooldownSeconds });
    await ctx.reply(helpMessage, extra);
  }
}
