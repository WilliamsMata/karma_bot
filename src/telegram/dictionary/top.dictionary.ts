import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface TopEntry {
  position: number;
  name: string;
  karma: number;
}

const topHeaderDictionary: PartialLocalizedDictionary<string> = {
  en: '🏆 Top 10 Karma Users:\n',
  es: '🏆 Top 10 usuarios con más karma:\n',
  ru: '🏆 Топ-10 пользователей по карме:\n',
  fa: '🏆 ۱۰ کاربر برتر از نظر کارما:\n',
};

const topEntryDictionary: PartialLocalizedDictionary<
  (entry: TopEntry) => string
> = {
  en: ({ position, name, karma }) => `${position}. ${name} has ${karma} karma`,
  es: ({ position, name, karma }) =>
    `${position}. ${name} tiene ${karma} de karma`,
  ru: ({ position, name, karma }) =>
    `${position}. ${name} имеет ${karma} кармы`,
  fa: ({ position, name, karma }) => `${position}. ${name} ${karma} کارما دارد`,
};

const topEmptyDictionary: PartialLocalizedDictionary<string> = {
  en: 'No karma data available yet for this group.',
  es: 'Todavía no hay datos de karma para este grupo.',
  ru: 'В этой группе пока нет данных по карме.',
  fa: 'هنوز هیچ اطلاعاتی از کارمای این گروه وجود ندارد.',
};

export function buildTopEmptyMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(topEmptyDictionary, language);
}

export function buildTopMessage(
  language: SupportedLanguage,
  entries: TopEntry[],
): string {
  const header = resolveLocalizedValue(topHeaderDictionary, language);
  const entryBuilder = resolveLocalizedValue(topEntryDictionary, language);
  const lines = entries.map((entry) => entryBuilder(entry));
  return `${header}\n${lines.join('\n')}`.trimEnd();
}
