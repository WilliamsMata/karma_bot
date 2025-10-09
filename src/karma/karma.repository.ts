import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  Connection,
  FilterQuery,
  Model,
  QueryOptions,
  UpdateQuery,
  Types,
  Document,
} from 'mongoose';
import { AbstractRepository } from '../database/abstract.repository';
import { User } from '../users/schemas/user.schema';
import { Karma, KarmaHistory } from './schemas/karma.schema';
import { TopReceivedKarmaDto } from './dto/top-received-karma.dto';
import type { PopulatedKarma } from './karma.types';

export type KarmaDocument = Document<unknown, object, Karma> & Karma;

export type KarmaHistoryPayload = {
  timestamp: Date;
  karmaChange: number;
  actor: Types.ObjectId;
  actorFirstName: string;
  actorLastName?: string;
  actorUserName?: string;
  actorTelegramId: number;
  targetFirstName?: string;
  targetLastName?: string;
  targetUserName?: string;
  targetTelegramId?: number;
  messageId?: number;
  chatId?: number;
};

@Injectable()
export class KarmaRepository extends AbstractRepository<Karma> {
  protected readonly logger = new Logger(KarmaRepository.name);

  constructor(
    @InjectModel(Karma.name) karmaModel: Model<Karma>,
    @InjectConnection() connection: Connection,
  ) {
    super(karmaModel, connection);
  }

  async updateSenderKarma(params: {
    senderId: Types.ObjectId;
    groupId: Types.ObjectId;
    incValue: number;
  }) {
    const { senderId, groupId, incValue } = params;
    const filterQuery: FilterQuery<Karma> = { user: senderId, group: groupId };
    const updateQuery: UpdateQuery<Karma> =
      incValue === 1 ? { $inc: { givenKarma: 1 } } : { $inc: { givenHate: 1 } };
    return this.upsert(filterQuery, updateQuery);
  }

  async updateReceiverKarma(params: {
    receiverId: Types.ObjectId;
    groupId: Types.ObjectId;
    incValue: number;
    historyEntry: KarmaHistoryPayload;
  }) {
    const { receiverId, groupId, incValue, historyEntry } = params;
    const filterQuery: FilterQuery<Karma> = {
      user: receiverId,
      group: groupId,
    };
    const updateQuery: UpdateQuery<Karma> = {
      $inc: { karma: incValue },
      $push: { history: historyEntry },
    };
    return this.upsert(filterQuery, updateQuery);
  }

  async findTopKarma(params: {
    groupId: Types.ObjectId;
    ascending: boolean;
    limit: number;
  }): Promise<PopulatedKarma[]> {
    const { groupId, ascending, limit } = params;
    const sortQuery: { [key: string]: 1 | -1 } = { karma: ascending ? 1 : -1 };
    return this.findWithPopulatedUser({
      filterQuery: { group: groupId },
      sortQuery,
      limit,
    });
  }

  async findTopGivers(params: {
    groupId: Types.ObjectId;
    field: 'givenKarma' | 'givenHate';
    limit: number;
  }): Promise<PopulatedKarma[]> {
    const { groupId, field, limit } = params;
    const sortQuery: { [key: string]: 1 | -1 } = { [field]: -1 };
    return this.findWithPopulatedUser({
      filterQuery: { group: groupId, [field]: { $gt: 0 } },
      sortQuery,
      limit,
    });
  }

  async findOneByUserAndGroup(params: {
    userId: Types.ObjectId;
    groupId: Types.ObjectId;
  }): Promise<Karma | null> {
    const { userId, groupId } = params;
    return this.findOne({ user: userId, group: groupId }).catch(() => null);
  }

  async findOneByUserAndGroupAndPopulate(params: {
    userId: Types.ObjectId;
    groupId: Types.ObjectId;
  }): Promise<PopulatedKarma | null> {
    const { userId, groupId } = params;
    const filterQuery: FilterQuery<Karma> = { user: userId, group: groupId };
    return this.findOneAndPopulate({ filterQuery, populatePath: 'user' });
  }

  async findByUserId(userId: Types.ObjectId): Promise<Karma[]> {
    return this.find({ user: userId });
  }

  async findTopReceived(params: {
    groupId: Types.ObjectId;
    daysBack: number;
    limit: number;
  }): Promise<TopReceivedKarmaDto[]> {
    const { groupId, daysBack, limit } = params;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const pipeline = [
      { $match: { group: groupId } },
      { $unwind: '$history' },
      {
        $match: {
          'history.timestamp': { $gte: startDate },
          'history.karmaChange': { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$user',
          totalKarmaReceived: { $sum: '$history.karmaChange' },
        },
      },
      { $sort: { totalKarmaReceived: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 0,
          totalKarmaReceived: 1,
          userId: '$userDetails.userId',
          firstName: '$userDetails.firstName',
          userName: '$userDetails.userName',
        },
      },
    ];
    return this.aggregate<TopReceivedKarmaDto>(pipeline);
  }

  async findOneByUserAndGroupForTransaction(params: {
    userId: Types.ObjectId;
    groupId: Types.ObjectId;
    session: ClientSession;
  }): Promise<KarmaDocument | null> {
    const { userId, groupId, session } = params;
    return this.model
      .findOne({ user: userId, group: groupId })
      .session(session);
  }

  async findWithPopulatedUser(params: {
    filterQuery: FilterQuery<Karma>;
    sortQuery: { [key: string]: 1 | -1 };
    limit: number;
  }): Promise<PopulatedKarma[]> {
    const { filterQuery, sortQuery, limit } = params;
    let query = this.model
      .find(filterQuery)
      .sort(sortQuery)
      .select('-history -__v')
      .populate<{ user: User }>('user', 'userId firstName lastName userName');

    if (limit > 0) {
      query = query.limit(limit);
    }
    return query.lean<PopulatedKarma[]>();
  }

  async findOneAndPopulate(params: {
    filterQuery: FilterQuery<Karma>;
    populatePath: string;
  }): Promise<PopulatedKarma | null> {
    const { filterQuery, populatePath } = params;
    return this.model
      .findOne(filterQuery)
      .populate(populatePath)
      .lean<PopulatedKarma>();
  }

  async aggregate<T>(pipeline: any[]): Promise<T[]> {
    return this.model.aggregate<T>(pipeline);
  }

  async findOneAndUpdateWithSession(params: {
    filterQuery: FilterQuery<Karma>;
    updateQuery: UpdateQuery<Karma>;
    options: QueryOptions & { session: ClientSession };
  }) {
    const { filterQuery, updateQuery, options } = params;
    return this.model.findOneAndUpdate(filterQuery, updateQuery, options);
  }

  async executeKarmaTransferInTransaction(params: {
    senderKarmaDoc: KarmaDocument;
    receiverId: Types.ObjectId;
    quantity: number;
    session: ClientSession;
    senderHistory: KarmaHistoryPayload;
    receiverHistory: KarmaHistoryPayload;
  }): Promise<{ senderKarma: KarmaDocument; receiverKarma: KarmaDocument }> {
    const {
      senderKarmaDoc,
      receiverId,
      quantity,
      session,
      senderHistory,
      receiverHistory,
    } = params;
    senderKarmaDoc.karma -= quantity;
    senderKarmaDoc.history.push(senderHistory as unknown as KarmaHistory);
    const savedSenderPromise = senderKarmaDoc.save({ session });

    const receiverUpdatePromise = this.findOneAndUpdateWithSession({
      filterQuery: { user: receiverId, group: senderKarmaDoc.group },
      updateQuery: {
        $inc: { karma: quantity },
        $push: {
          history: receiverHistory,
        },
      },
      options: { upsert: true, new: true, session },
    });

    const [savedSenderDoc, updatedReceiverDoc] = await Promise.all([
      savedSenderPromise,
      receiverUpdatePromise,
    ]);

    if (!updatedReceiverDoc) {
      throw new Error(
        'Critical error: Failed to update receiver karma document during transaction.',
      );
    }

    return { senderKarma: savedSenderDoc, receiverKarma: updatedReceiverDoc };
  }

  async populateUsers(documents: KarmaDocument[]): Promise<PopulatedKarma[]> {
    const populatedDocs = await this.model.populate(documents, {
      path: 'user',
      select: 'userId firstName lastName userName',
    });

    return populatedDocs.map(
      (doc) => doc.toObject() as unknown as PopulatedKarma,
    );
  }
}
