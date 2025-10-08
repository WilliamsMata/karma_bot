import type { SupportedLanguage } from '../../../groups/group-settings.service';
import { PartialLocalizedDictionary, resolveLocalizedValue } from './types';

export interface HelpMessageContext {
  cooldownSeconds: number;
}

type HelpMessageFactory = (context: HelpMessageContext) => string;

const helpMessageDictionary: PartialLocalizedDictionary<HelpMessageFactory> = {
  en: ({ cooldownSeconds }) => {
    const cooldownText = formatDurationEnglish(cooldownSeconds);
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
    const cooldownText = formatDurationSpanish(cooldownSeconds);
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
};

export function buildHelpMessage(
  language: SupportedLanguage,
  context: HelpMessageContext,
): string {
  const factory = resolveLocalizedValue(helpMessageDictionary, language);
  return factory(context);
}

function formatDurationEnglish(seconds: number): string {
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }
  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}

function formatDurationSpanish(seconds: number): string {
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
  }
  return seconds === 1 ? '1 segundo' : `${seconds} segundos`;
}
