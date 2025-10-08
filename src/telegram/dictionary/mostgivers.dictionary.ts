import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface MostGiversEntry {
  position: number;
  name: string;
  value: number;
}

const mostGiversEmptyPositiveDictionary: PartialLocalizedDictionary<string> = {
  en: '♥ No users have given positive karma yet.',
  es: '♥ Ningún usuario ha dado karma positivo todavía.',
  ru: '♥ Пока никто не дал положительную карму.',
  fa: '♥ هنوز هیچ کاربری کارمای مثبت نداده است.',
};

const mostGiversEmptyNegativeDictionary: PartialLocalizedDictionary<string> = {
  en: '😠 No users have given negative karma (hate) yet.',
  es: '😠 Ningún usuario ha dado hate (karma negativo) todavía.',
  ru: '😠 Пока никто не дал отрицательную карму (хейт).',
  fa: '😠 هنوز هیچ کاربری نفرت (کارمای منفی) نداده است.',
};

const mostGiversPositiveHeaderDictionary: PartialLocalizedDictionary<string> = {
  en: '♥ Top 10 Karma Givers:\n',
  es: '♥ Top 10 usuarios que dan karma:\n',
  ru: '♥ Топ-10 дарителей кармы:\n',
  fa: '♥ ۱۰ کاربر برتر در دادن کارما:\n',
};

const mostGiversNegativeHeaderDictionary: PartialLocalizedDictionary<string> = {
  en: '😠 Top 10 Hate Givers:\n',
  es: '😠 Top 10 usuarios que dan hate:\n',
  ru: '😠 Топ-10 дарителей хейта:\n',
  fa: '😠 ۱۰ کاربر برتر در دادن نفرت:\n',
};

const mostGiversPositiveEntryDictionary: PartialLocalizedDictionary<
  (entry: MostGiversEntry) => string
> = {
  en: ({ position, name, value }) =>
    `${position}. ${name} has given ${value} karma`,
  es: ({ position, name, value }) =>
    `${position}. ${name} ha dado ${value} de karma`,
  ru: ({ position, name, value }) => `${position}. ${name} дал ${value} кармы`,
  fa: ({ position, name, value }) =>
    `${position}. ${name} ${value} کارما داده است`,
};

const mostGiversNegativeEntryDictionary: PartialLocalizedDictionary<
  (entry: MostGiversEntry) => string
> = {
  en: ({ position, name, value }) =>
    `${position}. ${name} has given ${value} hate`,
  es: ({ position, name, value }) =>
    `${position}. ${name} ha dado ${value} de hate`,
  ru: ({ position, name, value }) => `${position}. ${name} дал ${value} хейта`,
  fa: ({ position, name, value }) =>
    `${position}. ${name} ${value} نفرت داده است`,
};

export function buildMostGiversPositiveMessage(
  language: SupportedLanguage,
  entries: MostGiversEntry[],
): string {
  const header = resolveLocalizedValue(
    mostGiversPositiveHeaderDictionary,
    language,
  );
  const entryBuilder = resolveLocalizedValue(
    mostGiversPositiveEntryDictionary,
    language,
  );
  const lines = entries.map((entry) => entryBuilder(entry));
  return `${header}\n${lines.join('\n')}`.trimEnd();
}

export function buildMostGiversNegativeMessage(
  language: SupportedLanguage,
  entries: MostGiversEntry[],
): string {
  const header = resolveLocalizedValue(
    mostGiversNegativeHeaderDictionary,
    language,
  );
  const entryBuilder = resolveLocalizedValue(
    mostGiversNegativeEntryDictionary,
    language,
  );
  const lines = entries.map((entry) => entryBuilder(entry));
  return `${header}\n${lines.join('\n')}`.trimEnd();
}

export function buildMostGiversEmptyPositive(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(mostGiversEmptyPositiveDictionary, language);
}

export function buildMostGiversEmptyNegative(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(mostGiversEmptyNegativeDictionary, language);
}
