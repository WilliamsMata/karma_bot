import { Injectable, Logger } from '@nestjs/common';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { UsersRepository } from './users.repository';
import { User } from './schemas/user.schema';

interface ITelegramUserData {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async findOrCreate(userData: ITelegramUserData): Promise<User> {
    const documentToUpsert: UpdateQuery<User> = {
      $set: {
        firstName: userData.first_name,
        lastName: userData.last_name,
        userName: userData.username,
      },
      $setOnInsert: { userId: userData.id },
    };

    const user = await this.usersRepository.upsert(
      { userId: userData.id },
      documentToUpsert,
    );
    if (!user) throw new Error(`Could not create or find user ${userData.id}`);
    return user;
  }

  async findOne(userQuery: FilterQuery<User>): Promise<User | null> {
    return this.usersRepository.findOne(userQuery).catch(() => null);
  }

  async count(): Promise<number> {
    return this.usersRepository.countDocuments();
  }
}
