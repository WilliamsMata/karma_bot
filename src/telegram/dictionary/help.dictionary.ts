import type { SupportedLanguage } from '../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';
import { formatDuration } from './localization.helpers';

export interface HelpMessageContext {
  cooldownSeconds: number;
}

type HelpMessageFactory = (context: HelpMessageContext) => string;

const helpMessageDictionary: PartialLocalizedDictionary<HelpMessageFactory> = {
  en: ({ cooldownSeconds }) => {
    const cooldownText = formatDuration(cooldownSeconds, 'en');
    return `
Hello! I'm the Karma Bot. Here's how you can interact with me:

*Basic Karma:*
  • Reply to a message with \`+1\` to give karma.
  • Reply to a message with \`-1\` to give hate (negative karma).
  *(Cooldown: ${cooldownText} between giving karma/hate)*

*Check Karma:*
  • \`/me\`: Shows your current karma, given karma, and given hate.
  • \`/getkarma <name or @username>\`: Shows the karma details of a specific user.

*Leaderboards:*
  • \`/top\`: Top 10 users with the most karma.
  • \`/hate\`: Top 10 users with the least karma (most hated).
  • \`/mostgivers\`: Top 10 users who gave the most karma and hate.
  • \`/today\`: Top 10 users who received the most karma in the last 24 hours.
  • \`/month\`: Top 10 users who received the most karma in the last 30 days.
  • \`/year\`: Top 10 users who received the most karma in the last 365 days.

*History:*
  • \`/history\`: Shows your last 10 karma changes.
  • \`/gethistory <name or @username>\`: Shows the last 10 karma changes for a specific user.

*Transfer Karma:*
  • \`/send <amount>\`: Reply to a user's message to send them a specific amount of your karma. (e.g., \`/send 5\`)

*Other:*
  • \`/help\`: Shows this help message.
  • \`/settings\`: Opens the group settings menu (admins only).
    `.trim();
  },
  es: ({ cooldownSeconds }) => {
    const cooldownText = formatDuration(cooldownSeconds, 'es');
    return `
¡Hola! Soy Karma Bot. Así puedes interactuar conmigo:

*Karma básico:*
  • Responde a un mensaje con \`+1\` para dar karma positivo.
  • Responde a un mensaje con \`-1\` para dar hate (karma negativo).
  *(Cooldown: ${cooldownText} entre cada acción de karma/hate)*

*Consultar karma:*
  • \`/me\`: Muestra tu karma actual, karma dado y hate dado.
  • \`/getkarma <nombre o @usuario>\`: Muestra el detalle de karma de otro usuario.

*Rankings:*
  • \`/top\`: Top 10 usuarios con más karma.
  • \`/hate\`: Top 10 usuarios con menos karma (más odiados).
  • \`/mostgivers\`: Top 10 usuarios que más karma y hate han dado.
  • \`/today\`: Top 10 usuarios con más karma recibido en las últimas 24 horas.
  • \`/month\`: Top 10 usuarios con más karma recibido en los últimos 30 días.
  • \`/year\`: Top 10 usuarios con más karma recibido en los últimos 365 días.

*Historial:*
  • \`/history\`: Muestra tus últimos 10 cambios de karma.
  • \`/gethistory <nombre o @usuario>\`: Muestra los últimos 10 cambios de karma de otro usuario.

*Transferir karma:*
  • \`/send <cantidad>\`: Responde al mensaje de un usuario para transferirle una cantidad de tu karma (ej. \`/send 5\`).

*Otros:*
  • \`/help\`: Muestra este mensaje de ayuda.
  • \`/settings\`: Abre el menú de configuración del grupo (solo administradores).
    `.trim();
  },
  ru: ({ cooldownSeconds }) => {
    const cooldownText = formatDuration(cooldownSeconds, 'ru');
    return `
Привет! Я Karma Bot. Вот как ты можешь со мной взаимодействовать:

*Базовая карма:*
  • Ответь на сообщение с \`+1\`, чтобы дать карму.
  • Ответь на сообщение с \`-1\`, чтобы дать хейт (отрицательную карму).
  *(Перерыв: ${cooldownText} между выдачей кармы/хейта)*

*Проверка кармы:*
  • \`/me\`: Показывает твою текущую карму, выданную карму и хейт.
  • \`/getkarma <имя или @username>\`: Показывает детали кармы выбранного пользователя.

*Таблицы лидеров:*
  • \`/top\`: Топ 10 пользователей с наибольшей кармой.
  • \`/hate\`: Топ 10 пользователей с наименьшей кармой (самые ненавидимые).
  • \`/mostgivers\`: Топ 10 пользователей, которые выдали больше всего кармы и хейта.
  • \`/today\`: Топ 10 пользователей, получивших больше всего кармы за последние 24 часа.
  • \`/month\`: Топ 10 пользователей, получивших больше всего кармы за последние 30 дней.
  • \`/year\`: Топ 10 пользователей, получивших больше всего кармы за последние 365 дней.

*История:*
  • \`/history\`: Показывает твои последние 10 изменений кармы.
  • \`/gethistory <имя или @username>\`: Показывает последние 10 изменений кармы выбранного пользователя.

*Передача кармы:*
  • \`/send <количество>\`: Ответь на сообщение пользователя, чтобы отправить ему указанное количество своей кармы (например, \`/send 5\`).

*Другое:*
  • \`/help\`: Показывает это справочное сообщение.
  • \`/settings\`: Открывает меню настроек группы (только для администраторов).
    `.trim();
  },
  fa: ({ cooldownSeconds }) => {
    const cooldownText = formatDuration(cooldownSeconds, 'fa');
    return `
سلام! من کارما بات هستم. اینطوری می‌تونی با من کار کنی:

*کارمای پایه:*
  • با پاسخ دادن به یک پیام با \`+1\` کارما بده.
  • با پاسخ دادن به یک پیام با \`-1\` نفرت (کارمای منفی) بده.
  *(دورهٔ انتظار: ${cooldownText} بین هر اقدام کارما/نفرت)*

*بررسی کارما:*
  • \`/me\`: کارمای فعلی، کارمای داده‌شده و نفرت داده‌شدهٔ تو را نشان می‌دهد.
  • \`/getkarma <نام یا @username>\`: جزئیات کارمای یک کاربر دیگر را نشان می‌دهد.

*جدول‌های برتر:*
  • \`/top\`: ۱۰ کاربر با بیشترین کارما.
  • \`/hate\`: ۱۰ کاربر با کمترین کارما (بیشترین نفرت).
  • \`/mostgivers\`: ۱۰ کاربری که بیشترین کارما و نفرت را داده‌اند.
  • \`/today\`: ۱۰ کاربر که در ۲۴ ساعت گذشته بیشترین کارما را دریافت کرده‌اند.
  • \`/month\`: ۱۰ کاربر که در ۳۰ روز گذشته بیشترین کارما را دریافت کرده‌اند.
  • \`/year\`: ۱۰ کاربر که در ۳۶۵ روز گذشته بیشترین کارما را دریافت کرده‌اند.

*تاریخچه:*
  • \`/history\`: آخرین ۱۰ تغییر کارمای تو را نشان می‌دهد.
  • \`/gethistory <نام یا @username>\`: آخرین ۱۰ تغییر کارمای یک کاربر دیگر را نشان می‌دهد.

*انتقال کارما:*
  • \`/send <مقدار>\`: با پاسخ به پیام یک کاربر، مقدار مشخصی از کارمایت را برای او بفرست (مثلاً \`/send 5\`).

*سایر:*
  • \`/help\`: همین پیام راهنما را نشان می‌دهد.
  • \`/settings\`: منوی تنظیمات گروه را باز می‌کند (فقط مدیران).
    `.trim();
  },
};

export function buildHelpMessage(
  language: SupportedLanguage,
  context: HelpMessageContext,
): string {
  const factory = resolveLocalizedValue(helpMessageDictionary, language);
  return factory(context);
}
