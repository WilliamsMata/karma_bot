import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

const telegramKeyboardOpenMiniAppButtonDictionary: PartialLocalizedDictionary<string> =
  {
    en: 'Open Mini App',
    es: 'Abrir Mini App',
    ru: 'Открыть мини-приложение',
    fa: 'باز کردن مینی‌اپ',
  };

export function buildTelegramKeyboardOpenMiniAppButtonLabel(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(
    telegramKeyboardOpenMiniAppButtonDictionary,
    language,
  );
}
