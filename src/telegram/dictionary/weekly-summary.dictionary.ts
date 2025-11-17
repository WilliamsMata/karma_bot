import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface WeeklySummaryEntry {
  position: number;
  name: string;
  karma: number;
}

const weeklySummaryHeaderDictionary: PartialLocalizedDictionary<string> = {
  en: '📅 Weekly karma summary',
  es: '📅 Resumen semanal de karma',
  ru: '📅 Еженедельный итог по карме',
  fa: '📅 گزارش هفتگی کارما',
};

const weeklySummaryIntroDictionary: PartialLocalizedDictionary<string> = {
  en: 'Top 10 users who received the most karma this week:',
  es: 'Top 10 usuarios que más karma recibieron esta semana:',
  ru: 'Топ-10 пользователей, которые получили больше всего кармы за неделю:',
  fa: '۱۰ کاربر برتر که این هفته بیشترین کارما را دریافت کردند:',
};

const weeklySummaryEmptyDictionary: PartialLocalizedDictionary<string> = {
  en: 'Nobody received karma in this group during the last 7 days.',
  es: 'Nadie recibió karma en este grupo durante los últimos 7 días.',
  ru: 'Никто не получил карму в этой группе за последние 7 дней.',
  fa: 'در این گروه هیچ کسی در ۷ روز گذشته کارما دریافت نکرد.',
};

const weeklySummaryEntryDictionary: PartialLocalizedDictionary<
  (entry: WeeklySummaryEntry) => string
> = {
  en: ({ position, name, karma }) =>
    `${position}. ${name} received ${karma} karma`,
  es: ({ position, name, karma }) =>
    `${position}. ${name} recibió ${karma} de karma`,
  ru: ({ position, name, karma }) =>
    `${position}. ${name} получил ${karma} кармы`,
  fa: ({ position, name, karma }) =>
    `${position}. ${name} ${karma} کارما دریافت کرد`,
};

const weeklySummaryFooterDictionary: PartialLocalizedDictionary<string> = {
  en: 'Tip: Disable this weekly notification anytime with /settings.',
  es: 'Tip: Desactiva esta notificación semanal cuando quieras con /settings.',
  ru: 'Совет: Отключить эту еженедельную рассылку можно через /settings.',
  fa: 'نکته: می‌توانی این اعلان هفتگی را هر زمان با /settings غیرفعال کنی.',
};

export function buildWeeklySummaryMessage(
  language: SupportedLanguage,
  entries: WeeklySummaryEntry[],
): string {
  const header = resolveLocalizedValue(weeklySummaryHeaderDictionary, language);
  const intro = resolveLocalizedValue(weeklySummaryIntroDictionary, language);
  const footer = resolveLocalizedValue(weeklySummaryFooterDictionary, language);
  const entryFactory = resolveLocalizedValue(
    weeklySummaryEntryDictionary,
    language,
  );
  const body = entries.map((entry) => entryFactory(entry)).join('\n');

  return `${header}\n${intro}\n\n${body}\n\n${footer}`.trim();
}

export function buildWeeklySummaryEmptyMessage(
  language: SupportedLanguage,
): string {
  const header = resolveLocalizedValue(weeklySummaryHeaderDictionary, language);
  const emptyState = resolveLocalizedValue(
    weeklySummaryEmptyDictionary,
    language,
  );
  const footer = resolveLocalizedValue(weeklySummaryFooterDictionary, language);

  return `${header}\n${emptyState}\n\n${footer}`.trim();
}
