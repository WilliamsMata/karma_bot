import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface HistorySuccessContext {
  historyMessage: string;
}

const historyEmptyDictionary: PartialLocalizedDictionary<string> = {
  en: 'No karma history available yet.',
  es: 'Aún no tienes historial de karma.',
  ru: 'История кармы пока отсутствует.',
  fa: 'هنوز هیچ تاریخچه‌ای از کارمای تو وجود ندارد.',
};

const historySuccessDictionary: PartialLocalizedDictionary<
  (context: HistorySuccessContext) => string
> = {
  en: ({ historyMessage }) =>
    `📜 Your karma history (last 10 changes):\n\n${historyMessage}`,
  es: ({ historyMessage }) =>
    `📜 Tu historial de karma (últimos 10 cambios):\n\n${historyMessage}`,
  ru: ({ historyMessage }) =>
    `📜 Твоя история кармы (последние 10 изменений):\n\n${historyMessage}`,
  fa: ({ historyMessage }) =>
    `📜 تاریخچهٔ کارمای تو (۱۰ تغییر اخیر):\n\n${historyMessage}`,
};

const historyErrorDictionary: PartialLocalizedDictionary<string> = {
  en: "Sorry, I couldn't retrieve your karma history.",
  es: 'Lo siento, no pude obtener tu historial de karma.',
  ru: 'Извини, не удалось получить историю твоей кармы.',
  fa: 'متأسفم، نتوانستم تاریخچهٔ کارمای تو را دریافت کنم.',
};

export function buildHistorySuccessMessage(
  language: SupportedLanguage,
  context: HistorySuccessContext,
): string {
  const factory = resolveLocalizedValue(historySuccessDictionary, language);
  return factory(context);
}

export function buildHistoryEmptyMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(historyEmptyDictionary, language);
}

export function buildHistoryErrorMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(historyErrorDictionary, language);
}
