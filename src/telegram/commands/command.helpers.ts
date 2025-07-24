type KarmaHistoryEntry = {
  timestamp: Date;
  karmaChange: number;
};

/**
 * Formatea un array de entradas de historial de karma en un string legible.
 * @param history - El array de entradas de historial.
 * @returns Un string con las últimas 10 entradas del historial, o un mensaje por defecto.
 */
export const formatKarmaHistory = (
  history: KarmaHistoryEntry[] | undefined,
): string => {
  if (!history || history.length === 0) {
    return 'No karma history found.';
  }

  // Tomamos solo las últimas 10 entradas para no saturar el chat.
  return history
    .slice(-10)
    .map((entry) => {
      const sign = entry.karmaChange > 0 ? '+' : '';
      const dateString = new Date(entry.timestamp).toLocaleString();
      return `${dateString}: ${sign}${entry.karmaChange}`;
    })
    .join('\n');
};
