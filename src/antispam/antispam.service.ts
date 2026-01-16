import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AntispamRepository } from './antispam.repository';
import { UsersService } from '../users/users.service';

export enum SpamType {
  BURST = 'BURST',
  DAILY_LIMIT = 'DAILY_LIMIT',
}

interface SpamRule {
  name: string;
  type: SpamType;
  windowMinutes: number;
  threshold: number;
  penalty: number;
  targetSpecific: boolean;
}

export interface SpamCheckResult {
  type: SpamType;
  penalty: number;
}

@Injectable()
export class AntispamService {
  private readonly logger = new Logger(AntispamService.name);

  // Rules are ordered by threshold descending to catch the most severe (or accumulated) spam first if multiple thresholds are met.
  private readonly rules: SpamRule[] = [
    {
      name: 'Burst: 30 in 60m',
      type: SpamType.BURST,
      windowMinutes: 60,
      threshold: 30,
      penalty: 30,
      targetSpecific: true,
    },
    {
      name: 'Burst: 10 in 15m',
      type: SpamType.BURST,
      windowMinutes: 15,
      threshold: 10,
      penalty: 10,
      targetSpecific: true,
    },
    {
      name: 'Burst: 5 in 7m',
      type: SpamType.BURST,
      windowMinutes: 7,
      threshold: 5,
      penalty: 5,
      targetSpecific: true,
    },
    {
      name: 'Daily Limit',
      type: SpamType.DAILY_LIMIT,
      windowMinutes: 24 * 60,
      threshold: 50,
      penalty: 0,
      targetSpecific: false,
    },
  ];

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
  ): Promise<SpamCheckResult | null> {
    // 1. Target Specific Checks (Burst)
    const targetRules = this.rules.filter((r) => r.targetSpecific);
    if (targetRules.length > 0) {
      const maxTargetThreshold = Math.max(
        ...targetRules.map((r) => r.threshold),
      );

      const lastTargetTransactions =
        await this.antispamRepository.findLastTransactions(
          { sourceUserId, targetUserId },
          maxTargetThreshold,
        );

      for (const rule of targetRules) {
        if (lastTargetTransactions.length >= rule.threshold) {
          // Check timestamp of the Nth transaction (index N-1)
          const checkTx = lastTargetTransactions[rule.threshold - 1];
          const windowCutoff = new Date(
            Date.now() - rule.windowMinutes * 60000,
          );

          if (
            checkTx &&
            checkTx.timestamp &&
            checkTx.timestamp > windowCutoff
          ) {
            this.logger.warn(
              `Spam detected: Rule "${rule.name}" triggered for user ${sourceUserId.toString()}`,
            );
            return { type: rule.type, penalty: rule.penalty };
          }
        }
      }
    }

    // 2. Global Checks (Daily Limit)
    const globalRules = this.rules.filter((r) => !r.targetSpecific);
    if (globalRules.length > 0) {
      const maxGlobalThreshold = Math.max(
        ...globalRules.map((r) => r.threshold),
      );

      // Optimization: For global limits, we just need to know if the Nth transaction is within the window.
      const lastGlobalTransactions =
        await this.antispamRepository.findLastTransactions(
          { sourceUserId },
          maxGlobalThreshold,
        );

      for (const rule of globalRules) {
        if (lastGlobalTransactions.length >= rule.threshold) {
          const checkTx = lastGlobalTransactions[rule.threshold - 1];
          const windowCutoff = new Date(
            Date.now() - rule.windowMinutes * 60000,
          );

          if (
            checkTx &&
            checkTx.timestamp &&
            checkTx.timestamp > windowCutoff
          ) {
            this.logger.warn(
              `Spam detected: Rule "${rule.name}" triggered for user ${sourceUserId.toString()}`,
            );
            return { type: rule.type, penalty: rule.penalty };
          }
        }
      }
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
}
