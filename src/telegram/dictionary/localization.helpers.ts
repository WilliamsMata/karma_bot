export function formatDurationEnglish(seconds: number): string {
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }
  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}

export function formatDurationSpanish(seconds: number): string {
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
  }
  return seconds === 1 ? '1 segundo' : `${seconds} segundos`;
}

export function formatDurationRussian(seconds: number): string {
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} ${getRussianPlural(minutes, 'минута', 'минуты', 'минут')}`;
  }
  return `${seconds} ${getRussianPlural(seconds, 'секунда', 'секунды', 'секунд')}`;
}

export function formatDurationPersian(seconds: number): string {
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return minutes === 1 ? '1 دقیقه' : `${minutes} دقیقه`;
  }
  return seconds === 1 ? '1 ثانیه' : `${seconds} ثانیه`;
}

export function getRussianPlural(
  value: number,
  formOne: string,
  formFew: string,
  formMany: string,
): string {
  const absValue = Math.abs(value) % 100;
  const lastDigit = absValue % 10;

  if (absValue > 10 && absValue < 20) {
    return formMany;
  }

  if (lastDigit > 1 && lastDigit < 5) {
    return formFew;
  }

  if (lastDigit === 1) {
    return formOne;
  }

  return formMany;
}
