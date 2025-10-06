export interface ITelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface ITelegramChat {
  id: number;
  title?: string;
}
