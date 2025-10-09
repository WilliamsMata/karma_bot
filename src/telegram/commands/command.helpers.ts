import type { SupportedLanguage } from '../../groups/group-settings.service';

type KarmaHistoryEntry = {
  timestamp: Date | string;
  karmaChange: number;
  actorFirstName?: string;
  actorLastName?: string;
  actorUserName?: string;
  actorTelegramId?: number;
  targetFirstName?: string;
  targetLastName?: string;
  targetUserName?: string;
  targetTelegramId?: number;
};

type UserLike = {
  firstName?: string;
  lastName?: string;
  userName?: string;
};

type FormatHistoryOptions = {
  language: SupportedLanguage;
  currentUserTelegramId: number;
  limit?: number;
  now?: Date;
  useSelfPronoun?: boolean;
  selfDisplayName?: string;
};

type HistoryTemplates = {
  received: (params: { actor: string; amount: string }) => string;
  removed: (params: { actor: string; amount: string }) => string;
  selfSent: (params: { target: string; amount: string }) => string;
  selfAdjusted: (params: { amount: string }) => string;
};

const LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
  en: 'en-US',
  es: 'es-ES',
  ru: 'ru-RU',
  fa: 'fa-IR',
};

const HISTORY_TEMPLATES: Record<SupportedLanguage, HistoryTemplates> = {
  en: {
    received: ({ actor, amount }) => `${actor} gave you ${amount} karma`,
    removed: ({ actor, amount }) => `${actor} took ${amount} karma from you`,
    selfSent: ({ target, amount }) => `You sent ${amount} karma to ${target}`,
    selfAdjusted: ({ amount }) => `You adjusted your karma by ${amount}`,
  },
  es: {
    received: ({ actor, amount }) => `${actor} te dio ${amount} de karma`,
    removed: ({ actor, amount }) => `${actor} te quitó ${amount} de karma`,
    selfSent: ({ target, amount }) => `Enviaste ${amount} de karma a ${target}`,
    selfAdjusted: ({ amount }) => `Ajustaste tu karma en ${amount}`,
  },
  ru: {
    received: ({ actor, amount }) => `${actor} дал тебе ${amount} кармы`,
    removed: ({ actor, amount }) => `${actor} забрал у тебя ${amount} кармы`,
    selfSent: ({ target, amount }) =>
      `Ты отправил ${amount} кармы пользователю ${target}`,
    selfAdjusted: ({ amount }) => `Ты изменил свою карму на ${amount}`,
  },
  fa: {
    received: ({ actor, amount }) => `${actor} به تو ${amount} کارما داد`,
    removed: ({ actor, amount }) => `${actor} ${amount} کارما از تو کم کرد`,
    selfSent: ({ target, amount }) => {
      return `تو ${amount} کارما برای ${target} فرستادی`;
    },
    selfAdjusted: ({ amount }) => `تو کارمای خودت را ${amount} تغییر دادی`,
  },
};

const RELATIVE_TIME_DIVISIONS: Array<{
  amount: number;
  unit: Intl.RelativeTimeFormatUnit;
}> = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

export const formatKarmaHistory = (
  history: KarmaHistoryEntry[] | undefined,
  options: FormatHistoryOptions,
): string => {
  if (!history || history.length === 0) {
    return 'No karma history found.';
  }

  const { language, currentUserTelegramId } = options;
  const limit = options.limit ?? 10;
  const useSelfPronoun = options.useSelfPronoun ?? true;
  const locale = LOCALE_BY_LANGUAGE[language] ?? 'en-US';
  const now = options.now ?? new Date();
  const templates = HISTORY_TEMPLATES[language];
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  });
  const relativeFormatter = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
  });

  return history
    .slice(-limit)
    .map((rawEntry) => normalizeHistoryEntry(rawEntry))
    .map((entry) => {
      const entryDate = entry.timestamp;
      const absoluteDate = dateFormatter.format(entryDate);
      const relativeDate = formatRelativeTime(
        entryDate,
        now,
        relativeFormatter,
      );

      const amount = formatKarmaAmount(entry.karmaChange);
      const rawActorDisplay = formatUsernameForDisplay({
        firstName: entry.actorFirstName,
        lastName: entry.actorLastName,
        userName: entry.actorUserName,
      });
      const rawTargetDisplay = formatUsernameForDisplay({
        firstName: entry.targetFirstName,
        lastName: entry.targetLastName,
        userName: entry.targetUserName,
      });
      const actorName =
        entry.actorTelegramId === currentUserTelegramId
          ? resolveSelfName({
              language,
              useSelfPronoun,
              fallbackName: rawActorDisplay,
              providedName: options.selfDisplayName,
            })
          : normalizeDisplayName(rawActorDisplay, language);

      const targetBase =
        entry.targetTelegramId === currentUserTelegramId && !useSelfPronoun
          ? (options.selfDisplayName ?? rawTargetDisplay)
          : rawTargetDisplay;
      const targetName = normalizeDisplayName(targetBase, language);

      const isSelfAction = entry.actorTelegramId === currentUserTelegramId;
      const isPositive = entry.karmaChange > 0;

      const message = determineHistoryLine({
        templates,
        isSelfAction,
        isPositive,
        actorName,
        targetName,
        amount,
      });

      return `• ${absoluteDate} UTC (${relativeDate}) — ${message}`;
    })
    .join('\n');
};

const normalizeHistoryEntry = (
  entry: KarmaHistoryEntry,
): KarmaHistoryEntry & { timestamp: Date } => {
  const timestamp =
    entry.timestamp instanceof Date
      ? entry.timestamp
      : new Date(entry.timestamp);

  return {
    actorTelegramId: 0,
    targetFirstName: undefined,
    targetLastName: undefined,
    targetUserName: undefined,
    targetTelegramId: undefined,
    actorFirstName: undefined,
    actorLastName: undefined,
    actorUserName: undefined,
    ...entry,
    timestamp,
  };
};

const determineHistoryLine = (params: {
  templates: HistoryTemplates;
  isSelfAction: boolean;
  isPositive: boolean;
  actorName: string;
  targetName: string;
  amount: string;
}): string => {
  const { templates, isSelfAction, isPositive, actorName, targetName, amount } =
    params;

  if (isSelfAction) {
    if (!isPositive) {
      return templates.selfSent({
        target: targetName,
        amount: stripSign(amount),
      });
    }

    return templates.selfAdjusted({ amount });
  }

  if (isPositive) {
    return templates.received({ actor: actorName, amount });
  }

  return templates.removed({ actor: actorName, amount: stripSign(amount) });
};

const formatKarmaAmount = (value: number): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}`;
};

const stripSign = (amount: string): string => amount.replace(/^[+-]/, '');

const formatRelativeTime = (
  entryDate: Date,
  now: Date,
  formatter: Intl.RelativeTimeFormat,
): string => {
  const elapsed = (entryDate.getTime() - now.getTime()) / 1000;
  let duration = elapsed;

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return formatter.format(Math.round(duration), 'year');
};

const resolveSelfPronoun = (language: SupportedLanguage): string => {
  switch (language) {
    case 'es':
      return 'Tú';
    case 'ru':
      return 'Ты';
    case 'fa':
      return 'تو';
    default:
      return 'You';
  }
};

const normalizeDisplayName = (
  value: string,
  language: SupportedLanguage,
): string => {
  if (value !== 'An unknown user') {
    return value;
  }

  switch (language) {
    case 'es':
      return 'Alguien';
    case 'ru':
      return 'Неизвестный пользователь';
    case 'fa':
      return 'کاربر ناشناس';
    default:
      return 'Someone';
  }
};

const resolveSelfName = (params: {
  language: SupportedLanguage;
  useSelfPronoun: boolean;
  fallbackName: string;
  providedName?: string;
}): string => {
  const { language, useSelfPronoun, fallbackName, providedName } = params;
  if (useSelfPronoun) {
    return resolveSelfPronoun(language);
  }

  const candidate = providedName ?? fallbackName;
  return normalizeDisplayName(candidate, language);
};

export const formatUsernameForDisplay = (user: UserLike): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (user.firstName) {
    return user.firstName;
  }

  if (user.userName) {
    return user.userName;
  }

  return 'An unknown user';
};
