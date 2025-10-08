import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export type TopReceivedPeriod = 'today' | 'month' | 'year';

export interface TopReceivedEntry {
  position: number;
  name: string;
  karma: number;
}

const topReceivedPeriodLabelDictionary: PartialLocalizedDictionary<
  (period: TopReceivedPeriod) => string
> = {
  en: (period) => {
    switch (period) {
      case 'today':
        return 'last 24 hours';
      case 'month':
        return 'last 30 days';
      case 'year':
        return 'last 365 days';
      default:
        return 'recent period';
    }
  },
  es: (period) => {
    switch (period) {
      case 'today':
        return 'últimas 24 horas';
      case 'month':
        return 'últimos 30 días';
      case 'year':
        return 'últimos 365 días';
      default:
        return 'periodo reciente';
    }
  },
  ru: (period) => {
    switch (period) {
      case 'today':
        return 'последние 24 часа';
      case 'month':
        return 'последние 30 дней';
      case 'year':
        return 'последние 365 дней';
      default:
        return 'последний период';
    }
  },
  fa: (period) => {
    switch (period) {
      case 'today':
        return '۲۴ ساعت گذشته';
      case 'month':
        return '۳۰ روز گذشته';
      case 'year':
        return '۳۶۵ روز گذشته';
      default:
        return 'دورهٔ اخیر';
    }
  },
};

const topReceivedHeaderDictionary: PartialLocalizedDictionary<
  (context: { periodLabel: string }) => string
> = {
  en: ({ periodLabel }) =>
    `🌟 Top 10 users by karma received in the ${periodLabel}:\n`,
  es: ({ periodLabel }) =>
    `🌟 Top 10 usuarios por karma recibido en las ${periodLabel}:\n`,
  ru: ({ periodLabel }) =>
    `🌟 Топ-10 пользователей по полученной карме за ${periodLabel}:\n`,
  fa: ({ periodLabel }) =>
    `🌟 ۱۰ کاربر برتر از نظر کارمای دریافت‌شده در ${periodLabel}:\n`,
};

const topReceivedEmptyDictionary: PartialLocalizedDictionary<
  (context: { periodLabel: string }) => string
> = {
  en: ({ periodLabel }) =>
    `No users received karma in the ${periodLabel} in this group.`,
  es: ({ periodLabel }) =>
    `Ningún usuario recibió karma en las ${periodLabel} en este grupo.`,
  ru: ({ periodLabel }) =>
    `В этой группе никто не получил карму за ${periodLabel}.`,
  fa: ({ periodLabel }) =>
    `در این گروه هیچ کاربری در ${periodLabel} کارما دریافت نکرد.`,
};

const topReceivedErrorDictionary: PartialLocalizedDictionary<
  (context: { periodLabel: string }) => string
> = {
  en: ({ periodLabel }) =>
    `Sorry, I couldn't retrieve the top users for the ${periodLabel}.`,
  es: ({ periodLabel }) =>
    `Lo siento, no pude obtener a los usuarios destacados de las ${periodLabel}.`,
  ru: ({ periodLabel }) =>
    `Извини, не удалось получить топ пользователей за ${periodLabel}.`,
  fa: ({ periodLabel }) =>
    `متأسفم، نتوانستم کاربران برتر ${periodLabel} را دریافت کنم.`,
};

const topReceivedEntryDictionary: PartialLocalizedDictionary<
  (entry: TopReceivedEntry) => string
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

function resolveTopReceivedPeriodLabel(
  language: SupportedLanguage,
  period: TopReceivedPeriod,
): string {
  const resolver = resolveLocalizedValue(
    topReceivedPeriodLabelDictionary,
    language,
  );
  return resolver(period);
}

export function buildTopReceivedMessage(
  language: SupportedLanguage,
  period: TopReceivedPeriod,
  entries: TopReceivedEntry[],
): string {
  const periodLabel = resolveTopReceivedPeriodLabel(language, period);
  const headerFactory = resolveLocalizedValue(
    topReceivedHeaderDictionary,
    language,
  );
  const entryFactory = resolveLocalizedValue(
    topReceivedEntryDictionary,
    language,
  );
  const header = headerFactory({ periodLabel });
  const lines = entries.map((entry) => entryFactory(entry));
  return `${header}\n${lines.join('\n')}`.trimEnd();
}

export function buildTopReceivedEmptyMessage(
  language: SupportedLanguage,
  period: TopReceivedPeriod,
): string {
  const periodLabel = resolveTopReceivedPeriodLabel(language, period);
  const factory = resolveLocalizedValue(topReceivedEmptyDictionary, language);
  return factory({ periodLabel });
}

export function buildTopReceivedErrorMessage(
  language: SupportedLanguage,
  period: TopReceivedPeriod,
): string {
  const periodLabel = resolveTopReceivedPeriodLabel(language, period);
  const factory = resolveLocalizedValue(topReceivedErrorDictionary, language);
  return factory({ periodLabel });
}
