type KarmaHistoryEntry = {
  timestamp: Date;
  karmaChange: number;
};

type UserLike = {
  firstName: string;
  lastName?: string;
  userName?: string;
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

export const formatUsernameForDisplay = (user: UserLike): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (user.firstName) {
    return user.firstName;
  }

  if (user.userName) {
    return user.userName;
  }

  return 'An unknown user';
};
