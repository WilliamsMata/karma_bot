import type { SupportedLanguage } from '../../../groups/group-settings.service';

export type PartialLocalizedDictionary<T> = {
  en: T;
} & Partial<Record<SupportedLanguage, T>>;

export function resolveLocalizedValue<T>(
  dictionary: PartialLocalizedDictionary<T>,
  language: SupportedLanguage,
  fallback: SupportedLanguage = 'en',
): T {
  return dictionary[language] ?? dictionary[fallback] ?? dictionary.en;
}
