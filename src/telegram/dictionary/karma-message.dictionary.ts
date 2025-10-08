import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';
import {
  formatDurationEnglish,
  formatDurationSpanish,
  formatDurationRussian,
  formatDurationPersian,
  getRussianPlural,
} from './localization.helpers';

export interface KarmaSuccessContext {
  receiverName: string;
  newKarma: number;
}

export interface KarmaCooldownContext {
  secondsLeft: number;
}

type KarmaSuccessFactory = (context: KarmaSuccessContext) => string;
type KarmaCooldownFactory = (context: KarmaCooldownContext) => string;

const karmaSuccessDictionary: PartialLocalizedDictionary<KarmaSuccessFactory> =
  {
    en: ({ receiverName, newKarma }) =>
      `${receiverName} now has ${newKarma} karma.`,
    es: ({ receiverName, newKarma }) =>
      `${receiverName} ahora tiene ${newKarma} de karma.`,
    ru: ({ receiverName, newKarma }) => {
      const karmaWord = getRussianPlural(newKarma, 'карма', 'кармы', 'карм');
      return `У ${receiverName} теперь ${newKarma} ${karmaWord}.`;
    },
    fa: ({ receiverName, newKarma }) =>
      `${receiverName} الان ${newKarma} کارما دارد.`,
  };

const karmaCooldownDictionary: PartialLocalizedDictionary<KarmaCooldownFactory> =
  {
    en: ({ secondsLeft }) =>
      `Please wait ${formatDurationEnglish(secondsLeft)} before giving karma again.`,
    es: ({ secondsLeft }) =>
      `Por favor espera ${formatDurationSpanish(secondsLeft)} antes de volver a dar karma.`,
    ru: ({ secondsLeft }) =>
      `Пожалуйста, подожди ${formatDurationRussian(secondsLeft)}, прежде чем снова давать карму.`,
    fa: ({ secondsLeft }) =>
      `لطفاً ${formatDurationPersian(secondsLeft)} صبر کن و بعد دوباره کارما بده.`,
  };

const karmaBotWarningDictionary: PartialLocalizedDictionary<string> = {
  en: 'You cannot give karma to bots.',
  es: 'No puedes dar karma a los bots.',
  ru: 'Нельзя давать карму ботам.',
  fa: 'نمی‌توانی به ربات‌ها کارما بدهی.',
};

export function buildKarmaSuccessMessage(
  language: SupportedLanguage,
  context: KarmaSuccessContext,
): string {
  const factory = resolveLocalizedValue(karmaSuccessDictionary, language);
  return factory(context);
}

export function buildKarmaCooldownMessage(
  language: SupportedLanguage,
  context: KarmaCooldownContext,
): string {
  const factory = resolveLocalizedValue(karmaCooldownDictionary, language);
  return factory(context);
}

export function buildKarmaBotWarning(language: SupportedLanguage): string {
  return resolveLocalizedValue(karmaBotWarningDictionary, language);
}
