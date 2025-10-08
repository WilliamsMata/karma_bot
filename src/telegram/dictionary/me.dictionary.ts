import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface MeKarmaContext {
  displayName: string;
  karma: number;
  givenKarma: number;
  givenHate: number;
  hasActivity: boolean;
}

const meMessageDictionary: PartialLocalizedDictionary<
  (context: MeKarmaContext) => string
> = {
  en: ({ displayName, karma, givenKarma, givenHate, hasActivity }) => {
    if (!hasActivity) {
      return (
        `🙋 Hi ${displayName}, your karma is 0 in this group.` +
        '\n\n' +
        '♥ Given karma: 0.' +
        '\n' +
        '😠 Given hate: 0.'
      );
    }

    return (
      `🙋 Hi ${displayName}, your karma is ${karma} in this group.` +
      '\n\n' +
      `♥ Given karma: ${givenKarma}.` +
      '\n' +
      `😠 Given hate: ${givenHate}.`
    );
  },
  es: ({ displayName, karma, givenKarma, givenHate, hasActivity }) => {
    if (!hasActivity) {
      return (
        `🙋 Hola ${displayName}, tu karma es 0 en este grupo.` +
        '\n\n' +
        '♥ Karma dado: 0.' +
        '\n' +
        '😠 Hate dado: 0.'
      );
    }

    return (
      `🙋 Hola ${displayName}, tu karma es ${karma} en este grupo.` +
      '\n\n' +
      `♥ Karma dado: ${givenKarma}.` +
      '\n' +
      `😠 Hate dado: ${givenHate}.`
    );
  },
  ru: ({ displayName, karma, givenKarma, givenHate, hasActivity }) => {
    if (!hasActivity) {
      return (
        `🙋 Привет, ${displayName}! Твоя карма в этой группе равна 0.` +
        '\n\n' +
        '♥ Выданная карма: 0.' +
        '\n' +
        '😠 Выданный хейт: 0.'
      );
    }

    return (
      `🙋 Привет, ${displayName}! Твоя карма в этой группе: ${karma}.` +
      '\n\n' +
      `♥ Выданная карма: ${givenKarma}.` +
      '\n' +
      `😠 Выданный хейт: ${givenHate}.`
    );
  },
  fa: ({ displayName, karma, givenKarma, givenHate, hasActivity }) => {
    if (!hasActivity) {
      return (
        `🙋 سلام ${displayName}، کارمای تو در این گروه ۰ است.` +
        '\n\n' +
        '♥ کارمای داده‌شده: ۰.' +
        '\n' +
        '😠 نفرت داده‌شده: ۰.'
      );
    }

    return (
      `🙋 سلام ${displayName}، کارمای تو در این گروه ${karma} است.` +
      '\n\n' +
      `♥ کارمای داده‌شده: ${givenKarma}.` +
      '\n' +
      `😠 نفرت داده‌شده: ${givenHate}.`
    );
  },
};

export function buildMeKarmaMessage(
  language: SupportedLanguage,
  context: MeKarmaContext,
): string {
  const factory = resolveLocalizedValue(meMessageDictionary, language);
  return factory(context);
}
