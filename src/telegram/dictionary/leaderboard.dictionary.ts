import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface LeaderboardEntry {
  position: number;
  name: string;
  value: number;
}

export type TopReceivedPeriod = 'today' | 'month' | 'year';

// --- Shared Builders ---

function buildEntryList(
  entries: LeaderboardEntry[],
  entryBuilder: (entry: LeaderboardEntry) => string,
): string {
  return entries.map(entryBuilder).join('\n');
}

// --- Top / Hate Dictionaries ---

const topHeaderDictionary: PartialLocalizedDictionary<string> = {
  en: '🏆 Top 10 Karma Users:\n',
  es: '🏆 Top 10 usuarios con más karma:\n',
  ru: '🏆 Топ-10 пользователей по карме:\n',
  fa: '🏆 ۱۰ کاربر برتر از نظر کارما:\n',
};

const topEntryDictionary: PartialLocalizedDictionary<
  (entry: LeaderboardEntry) => string
> = {
  en: ({ position, name, value }) => `${position}. ${name} has ${value} karma`,
  es: ({ position, name, value }) =>
    `${position}. ${name} tiene ${value} de karma`,
  ru: ({ position, name, value }) =>
    `${position}. ${name} имеет ${value} кармы`,
  fa: ({ position, name, value }) => `${position}. ${name} ${value} کارما دارد`,
};

const topEmptyDictionary: PartialLocalizedDictionary<string> = {
  en: 'No karma data available yet for this group.',
  es: 'Todavía no hay datos de karma para este grupo.',
  ru: 'В этой группе пока нет данных по карме.',
  fa: 'هنوز هیچ اطلاعاتی از کارمای این گروه وجود ندارد.',
};

const hateHeaderDictionary: PartialLocalizedDictionary<string> = {
  en: '😠 Top 10 Most Hated Users:\n',
  es: '😠 Top 10 usuarios con más hate:\n',
  ru: '😠 Топ-10 самых ненавидимых пользователей:\n',
  fa: '😠 ۱۰ کاربر با بیشترین نفرت:\n',
};

const hateEntryDictionary: PartialLocalizedDictionary<
  (entry: LeaderboardEntry) => string
> = {
  en: ({ position, name, value }) => `${position}. ${name} has ${value} karma`,
  es: ({ position, name, value }) =>
    `${position}. ${name} tiene ${value} de karma`,
  ru: ({ position, name, value }) => `${position}. ${name} — ${value} кармы`,
  fa: ({ position, name, value }) =>
    `${position}. ${name} دارای ${value} کارما است`,
};

const hateEmptyDictionary: PartialLocalizedDictionary<string> = {
  en: 'No karma data available yet for this group.',
  es: 'Aún no hay datos de karma para este grupo.',
  ru: 'Пока нет данных о карме для этой группы.',
  fa: 'هنوز هیچ داده‌ای از کارما برای این گروه موجود نیست.',
};

// --- Most Givers Dictionaries ---

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
  (entry: LeaderboardEntry) => string
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
  (entry: LeaderboardEntry) => string
> = {
  en: ({ position, name, value }) =>
    `${position}. ${name} has given ${value} hate`,
  es: ({ position, name, value }) =>
    `${position}. ${name} ha dado ${value} de hate`,
  ru: ({ position, name, value }) => `${position}. ${name} дал ${value} хейта`,
  fa: ({ position, name, value }) =>
    `${position}. ${name} ${value} نفرت داده است`,
};

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

// --- Top Received Dictionaries ---

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
    `متأسفم، نتوانستم کاربران برتر برای ${periodLabel} را بازیابی کنم.`,
};

// --- Exported Builders ---

// Top
export function buildTopEmptyMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(topEmptyDictionary, language);
}

export function buildTopMessage(
  language: SupportedLanguage,
  entries: LeaderboardEntry[],
): string {
  const header = resolveLocalizedValue(topHeaderDictionary, language);
  const entryBuilder = resolveLocalizedValue(topEntryDictionary, language);
  return `${header}\n${buildEntryList(entries, entryBuilder)}`.trimEnd();
}

// Hate
export function buildHateEmptyMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(hateEmptyDictionary, language);
}

export function buildHateLeaderboardMessage(
  language: SupportedLanguage,
  entries: LeaderboardEntry[],
): string {
  const header = resolveLocalizedValue(hateHeaderDictionary, language);
  const entryBuilder = resolveLocalizedValue(hateEntryDictionary, language);
  return `${header}\n${buildEntryList(entries, entryBuilder)}`.trimEnd();
}

// Most Givers
export function buildMostGiversPositiveMessage(
  language: SupportedLanguage,
  entries: LeaderboardEntry[],
): string {
  const header = resolveLocalizedValue(
    mostGiversPositiveHeaderDictionary,
    language,
  );
  const entryBuilder = resolveLocalizedValue(
    mostGiversPositiveEntryDictionary,
    language,
  );
  return `${header}\n${buildEntryList(entries, entryBuilder)}`.trimEnd();
}

export function buildMostGiversNegativeMessage(
  language: SupportedLanguage,
  entries: LeaderboardEntry[],
): string {
  const header = resolveLocalizedValue(
    mostGiversNegativeHeaderDictionary,
    language,
  );
  const entryBuilder = resolveLocalizedValue(
    mostGiversNegativeEntryDictionary,
    language,
  );
  return `${header}\n${buildEntryList(entries, entryBuilder)}`.trimEnd();
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

// Top Received
export function buildTopReceivedLeaderboardMessage(
  language: SupportedLanguage,
  period: TopReceivedPeriod,
  entries: LeaderboardEntry[],
): string {
  const periodLabelFactory = resolveLocalizedValue(
    topReceivedPeriodLabelDictionary,
    language,
  );
  const periodLabel = periodLabelFactory(period);
  const headerFactory = resolveLocalizedValue(
    topReceivedHeaderDictionary,
    language,
  );
  const header = headerFactory({ periodLabel });
  const entryBuilder = resolveLocalizedValue(topEntryDictionary, language); // Reusing top entry dictionary as format is same

  return `${header}\n${buildEntryList(entries, entryBuilder)}`.trimEnd();
}

export function buildTopReceivedEmptyMessage(
  language: SupportedLanguage,
  period: TopReceivedPeriod,
): string {
  const periodLabelFactory = resolveLocalizedValue(
    topReceivedPeriodLabelDictionary,
    language,
  );
  const periodLabel = periodLabelFactory(period);
  const factory = resolveLocalizedValue(topReceivedEmptyDictionary, language);
  return factory({ periodLabel });
}

export function buildTopReceivedErrorMessage(
  language: SupportedLanguage,
  period: TopReceivedPeriod,
): string {
  const periodLabelFactory = resolveLocalizedValue(
    topReceivedPeriodLabelDictionary,
    language,
  );
  const periodLabel = periodLabelFactory(period);
  const factory = resolveLocalizedValue(topReceivedErrorDictionary, language);
  return factory({ periodLabel });
}
