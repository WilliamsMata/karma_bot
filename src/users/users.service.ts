import { Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './schemas/user.schema';
import { ITelegramUser } from '../telegram/telegram.interfaces';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async findOrCreate(userData: ITelegramUser): Promise<User> {
    const user = await this.usersRepository.findOrCreate(userData);
    if (!user) throw new Error(`Could not create or find user ${userData.id}`);
    return user;
  }

  async findOneByUserId(userId: number): Promise<User | null> {
    return this.usersRepository.findOneByUserId(userId);
  }

  async findOneByUsernameOrName(input: string): Promise<User | null> {
    return this.usersRepository.findOneByUsernameOrName(input);
  }

  async count(): Promise<number> {
    return this.usersRepository.countDocuments();
  }
}
