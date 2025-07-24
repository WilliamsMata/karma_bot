type KarmaHistoryEntry = {
  timestamp: Date;
  karmaChange: number;
};

export const formatKarmaHistory = (
  history: KarmaHistoryEntry[] | undefined,
): string => {
  if (!history || history.length === 0) {
    return 'No karma history found.';
  }

  return history
    .slice(-10)
    .map((entry) => {
      const sign = entry.karmaChange > 0 ? '+' : '';
      const dateString = new Date(entry.timestamp).toLocaleString();
      return `${dateString}: ${sign}${entry.karmaChange}`;
    })
    .join('\n');
};
