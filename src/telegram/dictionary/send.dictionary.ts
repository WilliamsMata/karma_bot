import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface SendSuccessContext {
  senderName: string;
  receiverName: string;
  quantity: number;
  senderKarma: number;
  receiverKarma: number;
}

const sendReplyRequiredDictionary: PartialLocalizedDictionary<string> = {
  en: "You need to reply to a user's message to send them karma.",
  es: 'Necesitas responder al mensaje de un usuario para enviarle karma.',
  ru: 'Нужно ответить на сообщение пользователя, чтобы отправить ему карму.',
  fa: 'برای ارسال کارما باید به پیام یک کاربر پاسخ بدهی.',
};

const sendUsageDictionary: PartialLocalizedDictionary<string> = {
  en: 'You need to specify the amount to send. Usage: /send <amount>',
  es: 'Debes especificar la cantidad a enviar. Uso: /send <cantidad>',
  ru: 'Нужно указать количество. Формат: /send <количество>',
  fa: 'باید مقدار ارسال را مشخص کنی. نحوهٔ استفاده: /send <مقدار>',
};

const sendSelfTransferDictionary: PartialLocalizedDictionary<string> = {
  en: 'You cannot send karma to yourself.',
  es: 'No puedes enviarte karma a ti mismo.',
  ru: 'Нельзя отправлять карму самому себе.',
  fa: 'نمی‌توانی کارما را به خودت بفرستی.',
};

const sendBotTransferDictionary: PartialLocalizedDictionary<string> = {
  en: 'You cannot send karma to bots.',
  es: 'No puedes enviar karma a bots.',
  ru: 'Нельзя отправлять карму ботам.',
  fa: 'نمی‌توانی کارما را برای بات‌ها بفرستی.',
};

const sendInvalidAmountDictionary: PartialLocalizedDictionary<string> = {
  en: 'The amount must be a positive whole number. Example: /send 10',
  es: 'La cantidad debe ser un número entero positivo. Ejemplo: /send 10',
  ru: 'Количество должно быть положительным целым числом. Например: /send 10',
  fa: 'مقدار باید یک عدد صحیح مثبت باشد. مثال: /send 10',
};

const sendCriticalErrorDictionary: PartialLocalizedDictionary<string> = {
  en: 'A critical error occurred during the karma transfer.',
  es: 'Ocurrió un error crítico durante la transferencia de karma.',
  ru: 'Произошла критическая ошибка во время передачи кармы.',
  fa: 'هنگام انتقال کارما خطای بحرانی رخ داد.',
};

const sendSuccessDictionary: PartialLocalizedDictionary<
  (context: SendSuccessContext) => string
> = {
  en: ({ senderName, receiverName, quantity, senderKarma, receiverKarma }) =>
    `💸 ${senderName} has sent ${quantity} karma to ${receiverName}!\n\n${senderName} new karma: ${senderKarma}\n${receiverName} new karma: ${receiverKarma}`,
  es: ({ senderName, receiverName, quantity, senderKarma, receiverKarma }) =>
    `💸 ${senderName} ha enviado ${quantity} de karma a ${receiverName}!\n\nNuevo karma de ${senderName}: ${senderKarma}\nNuevo karma de ${receiverName}: ${receiverKarma}`,
  ru: ({ senderName, receiverName, quantity, senderKarma, receiverKarma }) =>
    `💸 ${senderName} отправил ${quantity} единиц кармы ${receiverName}!\n\nНовая карма ${senderName}: ${senderKarma}\nНовая карма ${receiverName}: ${receiverKarma}`,
  fa: ({ senderName, receiverName, quantity, senderKarma, receiverKarma }) =>
    `💸 ${senderName} مقدار ${quantity} کارما برای ${receiverName} فرستاد!\n\nکارمای جدید ${senderName}: ${senderKarma}\nکارمای جدید ${receiverName}: ${receiverKarma}`,
};

export function buildSendReplyRequiredMessage(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(sendReplyRequiredDictionary, language);
}

export function buildSendUsageMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(sendUsageDictionary, language);
}

export function buildSendSelfTransferMessage(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(sendSelfTransferDictionary, language);
}

export function buildSendBotTransferMessage(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(sendBotTransferDictionary, language);
}

export function buildSendInvalidAmountMessage(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(sendInvalidAmountDictionary, language);
}

export function buildSendCriticalErrorMessage(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(sendCriticalErrorDictionary, language);
}

export function buildSendSuccessMessage(
  language: SupportedLanguage,
  context: SendSuccessContext,
): string {
  const factory = resolveLocalizedValue(sendSuccessDictionary, language);
  return factory(context);
}
