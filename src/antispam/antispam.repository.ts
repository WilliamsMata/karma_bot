import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { AbstractRepository } from '../database/abstract.repository';
import { KarmaTransaction } from './schemas/karma-transaction.schema';

@Injectable()
export class AntispamRepository extends AbstractRepository<KarmaTransaction> {
  protected readonly logger = new Logger(AntispamRepository.name);

  constructor(
    @InjectModel(KarmaTransaction.name)
    karmaTransactionModel: Model<KarmaTransaction>,
    @InjectConnection() connection: Connection,
  ) {
    super(karmaTransactionModel, connection);
  }

  async countTransactions(
    filter: FilterQuery<KarmaTransaction>,
  ): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async findLastTransactions(
    filter: FilterQuery<KarmaTransaction>,
    limit: number,
  ): Promise<KarmaTransaction[]> {
    return this.model
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('timestamp')
      .lean();
  }
}
