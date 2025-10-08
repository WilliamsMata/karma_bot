import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface SettingsMainMenuContext {
  cooldownSeconds: number;
  languageLabel: string;
}

export interface SettingsCooldownMenuContext {
  currentCooldown: number;
}

export interface SettingsLanguageMenuContext {
  currentLanguageLabel: string;
}

export interface SettingsCooldownUpdatedContext {
  cooldownSeconds: number;
}

export interface SettingsLanguageUpdatedContext {
  languageLabel: string;
}

export interface SettingsLanguageButtonContext {
  languageLabel: string;
}

export interface SettingsCooldownOptionContext {
  seconds: number;
}

const settingsGroupOnlyDictionary: PartialLocalizedDictionary<string> = {
  en: 'This command is only available in group chats.',
  es: 'Este comando solo está disponible en chats de grupo.',
  ru: 'Эта команда доступна только в групповых чатах.',
  fa: 'این فرمان فقط در چت‌های گروهی در دسترس است.',
};

const settingsAdminOnlyDictionary: PartialLocalizedDictionary<string> = {
  en: 'Only group administrators can change settings.',
  es: 'Solo los administradores del grupo pueden cambiar la configuración.',
  ru: 'Только администраторы группы могут изменять настройки.',
  fa: 'فقط مدیران گروه می‌توانند تنظیمات را تغییر دهند.',
};

const settingsChatNotFoundDictionary: PartialLocalizedDictionary<string> = {
  en: 'Chat not found.',
  es: 'No se encontró el chat.',
  ru: 'Чат не найден.',
  fa: 'گفتگو پیدا نشد.',
};

const settingsUnsupportedLanguageDictionary: PartialLocalizedDictionary<string> =
  {
    en: 'Unsupported language selected.',
    es: 'Se seleccionó un idioma no soportado.',
    ru: 'Выбран неподдерживаемый язык.',
    fa: 'زبان انتخاب‌شده پشتیبانی نمی‌شود.',
  };

const settingsCooldownUpdatedDictionary: PartialLocalizedDictionary<
  (context: SettingsCooldownUpdatedContext) => string
> = {
  en: ({ cooldownSeconds }) =>
    `Cooldown updated to ${cooldownSeconds} seconds.`,
  es: ({ cooldownSeconds }) =>
    `El tiempo de espera se actualizó a ${cooldownSeconds} segundos.`,
  ru: ({ cooldownSeconds }) =>
    `Время ожидания обновлено до ${cooldownSeconds} секунд.`,
  fa: ({ cooldownSeconds }) =>
    `زمان انتظار به ${cooldownSeconds} ثانیه به‌روزرسانی شد.`,
};

const settingsLanguageUpdatedDictionary: PartialLocalizedDictionary<
  (context: SettingsLanguageUpdatedContext) => string
> = {
  en: ({ languageLabel }) => `Language updated to ${languageLabel}.`,
  es: ({ languageLabel }) => `El idioma se actualizó a ${languageLabel}.`,
  ru: ({ languageLabel }) => `Язык изменён на ${languageLabel}.`,
  fa: ({ languageLabel }) => `زبان به ${languageLabel} تغییر کرد.`,
};

const settingsMainMenuDictionary: PartialLocalizedDictionary<
  (context: SettingsMainMenuContext) => string
> = {
  en: ({ cooldownSeconds, languageLabel }) =>
    '⚙️ *Group Settings*\n\n' +
    `Current cooldown: *${cooldownSeconds} seconds*.\n\n` +
    `Language: *${languageLabel}*.\n\n` +
    'Choose a configuration to modify:',
  es: ({ cooldownSeconds, languageLabel }) =>
    '⚙️ *Configuración del grupo*\n\n' +
    `Tiempo de espera actual: *${cooldownSeconds} segundos*.\n\n` +
    `Idioma: *${languageLabel}*.\n\n` +
    'Elige una opción para modificar:',
  ru: ({ cooldownSeconds, languageLabel }) =>
    '⚙️ *Настройки группы*\n\n' +
    `Текущее время ожидания: *${cooldownSeconds} секунд*.\n\n` +
    `Язык: *${languageLabel}*.\n\n` +
    'Выберите параметр для изменения:',
  fa: ({ cooldownSeconds, languageLabel }) =>
    '⚙️ *تنظیمات گروه*\n\n' +
    `زمان انتظار فعلی: *${cooldownSeconds} ثانیه*.\n\n` +
    `زبان: *${languageLabel}*.\n\n` +
    'یک گزینه را برای ویرایش انتخاب کن:',
};

const settingsCooldownMenuDictionary: PartialLocalizedDictionary<
  (context: SettingsCooldownMenuContext) => string
> = {
  en: ({ currentCooldown }) =>
    '⚙️ *Group Settings*\n\n' +
    `Current cooldown: *${currentCooldown} seconds*.\n\n` +
    'Choose a new cooldown duration:',
  es: ({ currentCooldown }) =>
    '⚙️ *Configuración del grupo*\n\n' +
    `Tiempo de espera actual: *${currentCooldown} segundos*.\n\n` +
    'Elige un nuevo tiempo de espera:',
  ru: ({ currentCooldown }) =>
    '⚙️ *Настройки группы*\n\n' +
    `Текущее время ожидания: *${currentCooldown} секунд*.\n\n` +
    'Выберите новое время ожидания:',
  fa: ({ currentCooldown }) =>
    '⚙️ *تنظیمات گروه*\n\n' +
    `زمان انتظار فعلی: *${currentCooldown} ثانیه*.\n\n` +
    'یک زمان انتظار جدید انتخاب کن:',
};

const settingsLanguageMenuDictionary: PartialLocalizedDictionary<
  (context: SettingsLanguageMenuContext) => string
> = {
  en: ({ currentLanguageLabel }) =>
    '⚙️ *Group Settings*\n\n' +
    `Current language: *${currentLanguageLabel}*.\n\n` +
    'Choose a new language:',
  es: ({ currentLanguageLabel }) =>
    '⚙️ *Configuración del grupo*\n\n' +
    `Idioma actual: *${currentLanguageLabel}*.\n\n` +
    'Elige un nuevo idioma:',
  ru: ({ currentLanguageLabel }) =>
    '⚙️ *Настройки группы*\n\n' +
    `Текущий язык: *${currentLanguageLabel}*.\n\n` +
    'Выберите новый язык:',
  fa: ({ currentLanguageLabel }) =>
    '⚙️ *تنظیمات گروه*\n\n' +
    `زبان فعلی: *${currentLanguageLabel}*.\n\n` +
    'یک زبان جدید انتخاب کن:',
};

const settingsCloseMessageDictionary: PartialLocalizedDictionary<string> = {
  en: '✅ Settings updated. Use /settings to open this menu again.',
  es: '✅ Configuración actualizada. Usa /settings para abrir este menú otra vez.',
  ru: '✅ Настройки обновлены. Используйте /settings, чтобы открыть меню снова.',
  fa: '✅ تنظیمات به‌روزرسانی شد. برای باز کردن دوباره منو از /settings استفاده کن.',
};

const settingsCloseNotificationDictionary: PartialLocalizedDictionary<string> =
  {
    en: 'Settings closed.',
    es: 'Configuración cerrada.',
    ru: 'Настройки закрыты.',
    fa: 'تنظیمات بسته شد.',
  };

const settingsCooldownButtonDictionary: PartialLocalizedDictionary<string> = {
  en: '⏱️ Cooldown',
  es: '⏱️ Tiempo de espera',
  ru: '⏱️ Задержка',
  fa: '⏱️ زمان انتظار',
};

const settingsLanguageButtonDictionary: PartialLocalizedDictionary<
  (context: SettingsLanguageButtonContext) => string
> = {
  en: ({ languageLabel }) => `🌐 Language (${languageLabel})`,
  es: ({ languageLabel }) => `🌐 Idioma (${languageLabel})`,
  ru: ({ languageLabel }) => `🌐 Язык (${languageLabel})`,
  fa: ({ languageLabel }) => `🌐 زبان (${languageLabel})`,
};

const settingsConfirmButtonDictionary: PartialLocalizedDictionary<string> = {
  en: '✅ All set',
  es: '✅ Todo listo',
  ru: '✅ Готово',
  fa: '✅ انجام شد',
};

const settingsBackButtonDictionary: PartialLocalizedDictionary<string> = {
  en: '⬅️ Back',
  es: '⬅️ Atrás',
  ru: '⬅️ Назад',
  fa: '⬅️ بازگشت',
};

const settingsCooldownOptionDictionary: PartialLocalizedDictionary<
  (context: SettingsCooldownOptionContext) => string
> = {
  en: ({ seconds }) => `${seconds}s`,
  es: ({ seconds }) => `${seconds} s`,
  ru: ({ seconds }) => `${seconds} с`,
  fa: ({ seconds }) => `${seconds} ث`,
};

const settingsLanguageLabelDictionary: Record<
  SupportedLanguage,
  PartialLocalizedDictionary<string>
> = {
  en: {
    en: 'English',
    es: 'Inglés',
    ru: 'Английский',
    fa: 'انگلیسی',
  },
  es: {
    en: 'Spanish',
    es: 'Español',
    ru: 'Испанский',
    fa: 'اسپانیایی',
  },
  ru: {
    en: 'Russian',
    es: 'Ruso',
    ru: 'Русский',
    fa: 'روسی',
  },
  fa: {
    en: 'Persian',
    es: 'Persa',
    ru: 'Персидский',
    fa: 'فارسی',
  },
};

export function resolveSettingsLanguageLabel(
  language: SupportedLanguage,
  userLanguage: SupportedLanguage,
): string {
  const dictionary = settingsLanguageLabelDictionary[language];
  return resolveLocalizedValue(dictionary, userLanguage);
}

export function buildSettingsGroupOnlyMessage(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(settingsGroupOnlyDictionary, language);
}

export function buildSettingsAdminOnlyMessage(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(settingsAdminOnlyDictionary, language);
}

export function buildSettingsChatNotFoundMessage(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(settingsChatNotFoundDictionary, language);
}

export function buildSettingsUnsupportedLanguageMessage(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(settingsUnsupportedLanguageDictionary, language);
}

export function buildSettingsCooldownUpdatedMessage(
  language: SupportedLanguage,
  context: SettingsCooldownUpdatedContext,
): string {
  const factory = resolveLocalizedValue(
    settingsCooldownUpdatedDictionary,
    language,
  );
  return factory(context);
}

export function buildSettingsLanguageUpdatedMessage(
  language: SupportedLanguage,
  context: SettingsLanguageUpdatedContext,
): string {
  const factory = resolveLocalizedValue(
    settingsLanguageUpdatedDictionary,
    language,
  );
  return factory(context);
}

export function buildSettingsMainMenuMessage(
  language: SupportedLanguage,
  context: SettingsMainMenuContext,
): string {
  const factory = resolveLocalizedValue(settingsMainMenuDictionary, language);
  return factory(context);
}

export function buildSettingsCooldownMenuMessage(
  language: SupportedLanguage,
  context: SettingsCooldownMenuContext,
): string {
  const factory = resolveLocalizedValue(
    settingsCooldownMenuDictionary,
    language,
  );
  return factory(context);
}

export function buildSettingsLanguageMenuMessage(
  language: SupportedLanguage,
  context: SettingsLanguageMenuContext,
): string {
  const factory = resolveLocalizedValue(
    settingsLanguageMenuDictionary,
    language,
  );
  return factory(context);
}

export function buildSettingsCloseMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(settingsCloseMessageDictionary, language);
}

export function buildSettingsCloseNotification(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(settingsCloseNotificationDictionary, language);
}

export function buildSettingsCooldownButtonLabel(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(settingsCooldownButtonDictionary, language);
}

export function buildSettingsLanguageButtonLabel(
  language: SupportedLanguage,
  context: SettingsLanguageButtonContext,
): string {
  const factory = resolveLocalizedValue(
    settingsLanguageButtonDictionary,
    language,
  );
  return factory(context);
}

export function buildSettingsConfirmButtonLabel(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(settingsConfirmButtonDictionary, language);
}

export function buildSettingsBackButtonLabel(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(settingsBackButtonDictionary, language);
}

export function buildSettingsCooldownOptionLabel(
  language: SupportedLanguage,
  context: SettingsCooldownOptionContext,
): string {
  const factory = resolveLocalizedValue(
    settingsCooldownOptionDictionary,
    language,
  );
  return factory(context);
}
