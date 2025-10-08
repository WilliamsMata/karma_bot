import { Injectable } from '@nestjs/common';
import { TelegramKeyboardService } from '../../shared/telegram-keyboard.service';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import {
  DEFAULT_COOLDOWN_SECONDS,
  GroupSettingsService,
} from '../../../groups/group-settings.service';
import { buildHelpMessage } from '../../dictionary/help.dictionary';
import { TelegramLanguageService } from '../../shared/telegram-language.service';
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
    private readonly languageService: TelegramLanguageService,
  ) {}

  async handle(ctx: TextCommandContext): Promise<void> {
    const chat = ctx.chat;
    let language = this.languageService.resolveLanguageFromUser(ctx.from);
    if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {
      language = await this.languageService.resolveLanguage(chat);
    }

    const keyboard = this.keyboardService.getGroupWebAppKeyboard(
      chat,
      language,
    );

    const extra: ExtraReplyMessage = {};
    extra.parse_mode = 'Markdown';
    if (keyboard) {
      extra.reply_markup = keyboard.reply_markup;
    }

    let cooldownSeconds = DEFAULT_COOLDOWN_SECONDS;
    const chatId = chat?.id;
    if (
      chat &&
      (chat.type === 'group' || chat.type === 'supergroup') &&
      typeof chatId === 'number'
    ) {
      cooldownSeconds =
        await this.groupSettingsService.getCooldownSeconds(chatId);
    }

    const helpMessage = buildHelpMessage(language, { cooldownSeconds });
    await ctx.reply(helpMessage, extra);
  }
}
