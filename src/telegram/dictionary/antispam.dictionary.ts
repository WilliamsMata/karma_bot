import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface AntispamBanContext {
  bannedUntil: string | Date;
}

type AntispamBanFactory = (context: AntispamBanContext) => string;
type AntispamMessageFactory = () => string;

const burstSpamDictionary: PartialLocalizedDictionary<AntispamMessageFactory> =
  {
    en: () =>
      'Spam detected (BURST)! You have been banned for 24h and both parties penalized -10 karma.',
    es: () =>
      '¡Spam detectado (RÁFAGA)! Has sido baneado por 24h y ambos usuarios penalizados con -10 de karma.',
    ru: () =>
      'Обнаружен спам (ВСПЛЕСК)! Вы забанены на 24 часа, и оба пользователя оштрафованы на -10 кармы.',
    fa: () =>
      'اسپم شناسایی شد (BURST)! شما به مدت 24 ساعت بن شدید و هر دو طرف -10 کارما جریمه شدید.',
  };

const dailySpamDictionary: PartialLocalizedDictionary<AntispamMessageFactory> =
  {
    en: () => 'Spam detected (DAILY LIMIT)! You have been banned for 24h.',
    es: () => '¡Spam detectado (LÍMITE DIARIO)! Has sido baneado por 24 horas.',
    ru: () => 'Обнаружен спам (ДНЕВНОЙ ЛИМИТ)! Вы забанены на 24 часа.',
    fa: () => 'اسپم شناسایی شد (DAILY LIMIT)! شما به مدت 24 ساعت بن شدید.',
  };

const formatUtc = (date: Date | string, locale: string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return (
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: 'UTC',
    }).format(d) + ' UTC'
  );
};

const bannedUserDictionary: PartialLocalizedDictionary<AntispamBanFactory> = {
  en: ({ bannedUntil }) =>
    `You are banned until ${formatUtc(bannedUntil, 'en-US')}.`,
  es: ({ bannedUntil }) =>
    `Estás baneado hasta el ${formatUtc(bannedUntil, 'es-ES')}.`,
  ru: ({ bannedUntil }) => `Вы забанены до ${formatUtc(bannedUntil, 'ru-RU')}.`,
  fa: ({ bannedUntil }) =>
    `شما تا ${formatUtc(bannedUntil, 'fa-IR')} بن هستید.`,
};

export function buildBurstSpamMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(burstSpamDictionary, language)();
}

export function buildDailySpamMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(dailySpamDictionary, language)();
}

export function buildBannedUserMessage(
  language: SupportedLanguage,
  context: AntispamBanContext,
): string {
  return resolveLocalizedValue(bannedUserDictionary, language)(context);
}
