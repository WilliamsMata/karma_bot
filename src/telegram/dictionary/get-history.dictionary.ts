import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface GetHistorySuccessContext {
  input: string;
  historyMessage: string;
}

export interface GetHistoryErrorContext {
  input: string;
}

const getHistoryUsageDictionary: PartialLocalizedDictionary<string> = {
  en: 'Please specify a user. Usage: /gethistory <name or @username>',
  es: 'Por favor especifica un usuario. Uso: /gethistory <nombre o @usuario>',
  ru: 'Пожалуйста, укажи пользователя. Формат: /gethistory <имя или @username>',
  fa: 'لطفاً یک کاربر مشخص کن. نحوهٔ استفاده: /gethistory <نام یا @username>',
};

const getHistorySuccessDictionary: PartialLocalizedDictionary<
  (context: GetHistorySuccessContext) => string
> = {
  en: ({ input, historyMessage }) =>
    `📜 Karma history for ${input} (last 10 changes):\n\n${historyMessage}`,
  es: ({ input, historyMessage }) =>
    `📜 Historial de karma para ${input} (últimos 10 cambios):\n\n${historyMessage}`,
  ru: ({ input, historyMessage }) =>
    `📜 История кармы для ${input} (последние 10 изменений):\n\n${historyMessage}`,
  fa: ({ input, historyMessage }) =>
    `📜 تاریخچهٔ کارما برای ${input} (۱۰ تغییر اخیر):\n\n${historyMessage}`,
};

const getHistoryErrorDictionary: PartialLocalizedDictionary<
  (context: GetHistoryErrorContext) => string
> = {
  en: ({ input }) => `Sorry, I couldn't retrieve the history for "${input}".`,
  es: ({ input }) => `Lo siento, no pude obtener el historial de "${input}".`,
  ru: ({ input }) => `Извини, не удалось получить историю для "${input}".`,
  fa: ({ input }) => `متأسفم، نتوانستم تاریخچهٔ «${input}» را دریافت کنم.`,
};

export function buildGetHistoryUsageMessage(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(getHistoryUsageDictionary, language);
}

export function buildGetHistorySuccessMessage(
  language: SupportedLanguage,
  context: GetHistorySuccessContext,
): string {
  const factory = resolveLocalizedValue(getHistorySuccessDictionary, language);
  return factory(context);
}

export function buildGetHistoryErrorMessage(
  language: SupportedLanguage,
  context: GetHistoryErrorContext,
): string {
  const factory = resolveLocalizedValue(getHistoryErrorDictionary, language);
  return factory(context);
}
