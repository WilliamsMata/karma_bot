import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface HateEntry {
  position: number;
  name: string;
  karma: number;
}

const hateEmptyDictionary: PartialLocalizedDictionary<string> = {
  en: 'No karma data available yet for this group.',
  es: 'Aún no hay datos de karma para este grupo.',
  ru: 'Пока нет данных о карме для этой группы.',
  fa: 'هنوز هیچ داده‌ای از کارما برای این گروه موجود نیست.',
};

const hateHeaderDictionary: PartialLocalizedDictionary<string> = {
  en: '😠 Top 10 Most Hated Users:\n',
  es: '😠 Top 10 usuarios con más hate:\n',
  ru: '😠 Топ-10 самых ненавидимых пользователей:\n',
  fa: '😠 ۱۰ کاربر با بیشترین نفرت:\n',
};

const hateEntryDictionary: PartialLocalizedDictionary<
  (entry: HateEntry) => string
> = {
  en: ({ position, name, karma }) => `${position}. ${name} has ${karma} karma`,
  es: ({ position, name, karma }) =>
    `${position}. ${name} tiene ${karma} de karma`,
  ru: ({ position, name, karma }) => `${position}. ${name} — ${karma} кармы`,
  fa: ({ position, name, karma }) =>
    `${position}. ${name} دارای ${karma} کارما است`,
};

export function buildHateEmptyMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(hateEmptyDictionary, language);
}

export function buildHateLeaderboardMessage(
  language: SupportedLanguage,
  entries: HateEntry[],
): string {
  const header = resolveLocalizedValue(hateHeaderDictionary, language);
  const entryBuilder = resolveLocalizedValue(hateEntryDictionary, language);

  const lines = entries.map((entry) => entryBuilder(entry));
  return `${header}\n${lines.join('\n')}`.trimEnd();
}
