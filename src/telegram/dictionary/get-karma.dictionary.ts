import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface GetKarmaSuccessContext {
  displayName: string;
  karma: number;
  givenKarma: number;
  givenHate: number;
}

export interface GetKarmaErrorContext {
  input: string;
}

const getKarmaUsageDictionary: PartialLocalizedDictionary<string> = {
  en: 'Please specify a user. Usage: /getkarma <name or @username>',
  es: 'Por favor especifica un usuario. Uso: /getkarma <nombre o @usuario>',
  ru: 'Пожалуйста, укажи пользователя. Формат: /getkarma <имя или @username>',
  fa: 'لطفاً یک کاربر مشخص کن. نحوهٔ استفاده: /getkarma <نام یا @username>',
};

const getKarmaNotFoundDictionary: PartialLocalizedDictionary<
  (context: GetKarmaErrorContext) => string
> = {
  en: ({ input }) => `No karma found for user "${input}" in this group.`,
  es: ({ input }) =>
    `No se encontró karma para el usuario "${input}" en este grupo.`,
  ru: ({ input }) =>
    `Карма для пользователя "${input}" в этой группе не найдена.`,
  fa: ({ input }) => `هیچ کارمایی برای کاربر «${input}» در این گروه پیدا نشد.`,
};

const getKarmaSuccessDictionary: PartialLocalizedDictionary<
  (context: GetKarmaSuccessContext) => string
> = {
  en: ({ displayName, karma, givenKarma, givenHate }) =>
    [
      `👤 User: ${displayName}`,
      `✨ Karma: ${karma} in this group`,
      '',
      `♥ Given karma: ${givenKarma}.`,
      `😠 Given hate: ${givenHate}.`,
    ].join('\n'),
  es: ({ displayName, karma, givenKarma, givenHate }) =>
    [
      `👤 Usuario: ${displayName}`,
      `✨ Karma: ${karma} en este grupo`,
      '',
      `♥ Karma dado: ${givenKarma}.`,
      `😠 Hate dado: ${givenHate}.`,
    ].join('\n'),
  ru: ({ displayName, karma, givenKarma, givenHate }) =>
    [
      `👤 Пользователь: ${displayName}`,
      `✨ Карма: ${karma} в этой группе`,
      '',
      `♥ Выданная карма: ${givenKarma}.`,
      `😠 Выданный хейт: ${givenHate}.`,
    ].join('\n'),
  fa: ({ displayName, karma, givenKarma, givenHate }) =>
    [
      `👤 کاربر: ${displayName}`,
      `✨ کارما: ${karma} در این گروه`,
      '',
      `♥ کارمای داده‌شده: ${givenKarma}.`,
      `😠 نفرت داده‌شده: ${givenHate}.`,
    ].join('\n'),
};

const getKarmaErrorDictionary: PartialLocalizedDictionary<
  (context: GetKarmaErrorContext) => string
> = {
  en: ({ input }) => `Sorry, I couldn't retrieve karma for "${input}".`,
  es: ({ input }) => `Lo siento, no pude obtener el karma de "${input}".`,
  ru: ({ input }) => `Извини, не удалось получить карму для "${input}".`,
  fa: ({ input }) => `متأسفم، نتوانستم کارمای «${input}» را دریافت کنم.`,
};

export function buildGetKarmaNotFoundMessage(
  language: SupportedLanguage,
  context: GetKarmaErrorContext,
): string {
  const factory = resolveLocalizedValue(getKarmaNotFoundDictionary, language);
  return factory(context);
}

export function buildGetKarmaUsageMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(getKarmaUsageDictionary, language);
}

export function buildGetKarmaSuccessMessage(
  language: SupportedLanguage,
  context: GetKarmaSuccessContext,
): string {
  const factory = resolveLocalizedValue(getKarmaSuccessDictionary, language);
  return factory(context);
}

export function buildGetKarmaErrorMessage(
  language: SupportedLanguage,
  context: GetKarmaErrorContext,
): string {
  const factory = resolveLocalizedValue(getKarmaErrorDictionary, language);
  return factory(context);
}
