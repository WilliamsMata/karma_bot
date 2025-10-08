import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

const startMessageDictionary: PartialLocalizedDictionary<string> = {
  en: `👋 *Hello! I'm Karma Bot.*

I'm your companion to measure the good vibes in your groups. With me you can:
• Give positive karma by replying with \`+1\`.
• Give negative karma (hate) by replying with \`-1\`.
• Check rankings, histories, and transfer karma to your friends.

Ready to start? Add me to your group and let's track who spreads the most good vibes!`,
  es: `👋 *¡Hola! Soy Karma Bot.*

Soy tu compañero para medir las buenas vibras en tus grupos. Conmigo puedes:
• Dar karma positivo respondiendo con \`+1\`.
• Dar karma negativo (hate) respondiendo con \`-1\`.
• Revisar rankings, historiales y transferir karma a tus amigos.

¿Listo para comenzar? ¡Agrégame a tu grupo y veamos quién comparte más buenas vibras!`,
  ru: `👋 *Привет! Я — Karma Bot.*

Я помогу измерять хорошие вайбы в ваших чатах. Со мной ты можешь:
• Давать положительную карму, отвечая сообщением \`+1\`.
• Давать отрицательную карму (хейт), отвечая \`-1\`.
• Проверять рейтинги, историю и переводить карму друзьям.

Готов начать? Добавь меня в свой чат и посмотрим, кто приносит больше всего положительной кармы!`,
  fa: `👋 *سلام! من کارما بات هستم.*

همراهت هستم تا حال‌وهوای خوب گروهت را اندازه بگیری. با من می‌توانی:
• با پاسخ \`+1\` کارمای مثبت بدهی.
• با پاسخ \`-1\` کارمای منفی (نفرت) بدهی.
• رتبه‌بندی‌ها و تاریخچه‌ها را ببینی و به دوستانت کارما منتقل کنی.

آماده‌ای شروع کنیم؟ من را به گروهت اضافه کن تا ببینیم چه کسی بیشترین حال خوب را پخش می‌کند!`,
};

const startButtonLabelDictionary: PartialLocalizedDictionary<string> = {
  en: '➕ Add to group',
  es: '➕ Agregar al grupo',
  ru: '➕ Добавить в чат',
  fa: '➕ افزودن به گروه',
};

const startBotNotConfiguredDictionary: PartialLocalizedDictionary<string> = {
  en: 'Oops! The bot is not configured correctly. Please contact the administrator.',
  es: '¡Ups! El bot no está configurado correctamente. Por favor, contacta al administrador.',
  ru: 'Упс! Бот настроен неверно. Пожалуйста, свяжитесь с администратором.',
  fa: 'اوه! پیکربندی بات درست نیست. لطفاً با مدیر تماس بگیر.',
};

export function buildStartMessage(language: SupportedLanguage): string {
  return resolveLocalizedValue(startMessageDictionary, language);
}

export function buildStartButtonLabel(language: SupportedLanguage): string {
  return resolveLocalizedValue(startButtonLabelDictionary, language);
}

export function buildStartBotNotConfiguredMessage(
  language: SupportedLanguage,
): string {
  return resolveLocalizedValue(startBotNotConfiguredDictionary, language);
}
