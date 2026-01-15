import { Injectable, Logger } from '@nestjs/common';
import { Types, FilterQuery } from 'mongoose';
import { KarmaTransaction } from './schemas/karma-transaction.schema';
import { AntispamRepository } from './antispam.repository';
import { UsersService } from '../users/users.service';

export enum SpamType {
  BURST = 'BURST',
  DAILY_LIMIT = 'DAILY_LIMIT',
}

@Injectable()
export class AntispamService {
  private readonly logger = new Logger(AntispamService.name);

  // Constants for thresholds
  private readonly BURST_THRESHOLD = 10;
  private readonly BURST_WINDOW_MINUTES = 15;

  private readonly DAILY_THRESHOLD = 50;
  private readonly DAILY_WINDOW_HOURS = 24;

  constructor(
    private readonly antispamRepository: AntispamRepository,
    private readonly usersService: UsersService,
  ) {}

  async logTransaction(
    sourceUserId: Types.ObjectId,
    targetUserId: Types.ObjectId,
    groupId: Types.ObjectId,
    type: 'KARMA' | 'HATE',
  ): Promise<void> {
    await this.antispamRepository.create({
      sourceUserId,
      targetUserId,
      groupId,
      type,
    });
  }

  async checkSpam(
    sourceUserId: Types.ObjectId,
    targetUserId: Types.ObjectId,
  ): Promise<SpamType | null> {
    // 1. Check Burst (actions to SAME target in 15 mins)
    const burstCount = await this.countTransactions(
      sourceUserId,
      this.BURST_WINDOW_MINUTES,
      'minutes',
      targetUserId,
    );

    if (burstCount >= this.BURST_THRESHOLD) {
      return SpamType.BURST;
    }

    // 2. Check Daily Limit (actions TOTAL in 24h)
    const dailyCount = await this.countTransactions(
      sourceUserId,
      this.DAILY_WINDOW_HOURS,
      'hours',
    );

    if (dailyCount >= this.DAILY_THRESHOLD) {
      return SpamType.DAILY_LIMIT;
    }

    return null;
  }

  async applyBan(telegramUserId: number): Promise<void> {
    const bannedUntil = new Date();
    bannedUntil.setHours(bannedUntil.getHours() + 24);

    await this.usersService.banUser(telegramUserId, bannedUntil);

    this.logger.warn(
      `User ${telegramUserId} has been banned until ${bannedUntil.toISOString()}`,
    );
  }

  private async countTransactions(
    sourceUserId: Types.ObjectId,
    value: number,
    unit: 'minutes' | 'hours',
    targetUserId?: Types.ObjectId,
  ): Promise<number> {
    const since = new Date();
    if (unit === 'minutes') {
      since.setMinutes(since.getMinutes() - value);
    } else {
      since.setHours(since.getHours() - value);
    }

    const filter: FilterQuery<KarmaTransaction> = {
      sourceUserId,
      timestamp: { $gte: since },
    };

    if (targetUserId) {
      filter.targetUserId = targetUserId;
    }

    return this.antispamRepository.countTransactions(filter);
  }
}
