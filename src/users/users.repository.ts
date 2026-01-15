import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, FilterQuery, UpdateQuery } from 'mongoose';
import { AbstractRepository } from '../database/abstract.repository';
import { ITelegramUser } from '../telegram/telegram.interfaces';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersRepository extends AbstractRepository<User> {
  protected readonly logger = new Logger(UsersRepository.name);

  constructor(
    @InjectModel(User.name) userModel: Model<User>,
    @InjectConnection() connection: Connection,
  ) {
    super(userModel, connection);
  }

  async findOrCreate(userData: ITelegramUser): Promise<User | null> {
    const filterQuery: FilterQuery<User> = { userId: userData.id };
    const documentToUpsert: UpdateQuery<User> = {
      $set: {
        firstName: userData.first_name,
        lastName: userData.last_name,
        userName: userData.username,
      },
      $setOnInsert: { userId: userData.id },
    };
    return this.upsert(filterQuery, documentToUpsert);
  }

  async findOneByUserId(userId: number): Promise<User | null> {
    return this.findOne({ userId }).catch(() => null);
  }

  async findOneByUsernameOrName(input: string): Promise<User | null> {
    const isUsername = input.startsWith('@');
    const queryValue = isUsername ? input.substring(1) : input;

    const filterQuery = isUsername
      ? { userName: new RegExp(`^${queryValue}$`, 'i') }
      : {
          $or: [
            { firstName: new RegExp(`^${queryValue}$`, 'i') },
            { lastName: new RegExp(`^${queryValue}$`, 'i') },
          ],
        };

    return this.findOne(filterQuery).catch(() => null);
  }

  async countDocuments(filterQuery: FilterQuery<User> = {}): Promise<number> {
    return this.model.countDocuments(filterQuery);
  }

  async setBanStatus(userId: number, bannedUntil: Date): Promise<User | null> {
    return this.findOneAndUpdate({ userId }, { bannedUntil });
  }
}
