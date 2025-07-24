import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpdateQuery } from 'mongoose';
import { KarmaRepository } from './karma.repository';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { User } from '../users/schemas/user.schema';
import { Group } from '../groups/schemas/group.schema';
import { Karma } from './schemas/karma.schema';
import { TopReceivedKarmaDto } from './dto/top-received-karma.dto';

interface ITelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}
interface ITelegramChat {
  id: number;
  title?: string;
}

type PopulatedKarma = Karma & { user: User };

@Injectable()
export class KarmaService {
  private readonly logger = new Logger(KarmaService.name);

  constructor(
    private readonly karmaRepository: KarmaRepository,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  public async updateKarma(
    senderData: ITelegramUser,
    receiverData: ITelegramUser,
    chatData: ITelegramChat,
    incValue: number,
  ) {
    const [groupDoc, senderUserDoc, receiverUserDoc] = await Promise.all([
      this.groupsService.findOrCreate(chatData),
      this.usersService.findOrCreate(senderData),
      this.usersService.findOrCreate(receiverData),
    ]);

    const incGivenKarmaOrHate: UpdateQuery<Karma> =
      incValue === 1 ? { $inc: { givenKarma: 1 } } : { $inc: { givenHate: 1 } };

    await this.karmaRepository.upsert(
      { user: senderUserDoc._id, group: groupDoc._id },
      incGivenKarmaOrHate,
    );

    const receiverKarma = await this.karmaRepository.upsert(
      { user: receiverUserDoc._id, group: groupDoc._id },
      {
        $inc: { karma: incValue },
        $push: { history: { karmaChange: incValue } as any },
      },
    );

    if (!receiverKarma) throw new Error('Failed to update receiver karma.');

    const receiverName = receiverUserDoc.userName
      ? `@${receiverUserDoc.userName}`
      : receiverUserDoc.firstName;
    return { receiverName, newKarma: receiverKarma.karma };
  }

  public async transferKarma(
    senderData: ITelegramUser,
    receiverData: ITelegramUser,
    chatData: ITelegramChat,
    quantity: number,
  ): Promise<{ senderKarma: PopulatedKarma; receiverKarma: PopulatedKarma }> {
    const [groupDoc, senderUserDoc, receiverUserDoc] = await Promise.all([
      this.groupsService.findOrCreate(chatData),
      this.usersService.findOrCreate(senderData),
      this.usersService.findOrCreate(receiverData),
    ]);

    const session = await this.karmaRepository.startTransaction();
    try {
      const senderKarmaDoc = await this.karmaRepository.findOneWithSession(
        { user: senderUserDoc._id, group: groupDoc._id },
        session,
      );

      if (!senderKarmaDoc || senderKarmaDoc.karma < quantity) {
        throw new BadRequestException(
          `You don't have enough karma. Your current karma is ${
            senderKarmaDoc?.karma ?? 0
          }.`,
        );
      }

      senderKarmaDoc.karma -= quantity;
      senderKarmaDoc.history.push({
        karmaChange: -quantity,
        timestamp: new Date(),
      });
      await senderKarmaDoc.save({ session });

      const receiverKarmaDoc =
        await this.karmaRepository.findOneAndUpdateWithSession(
          { user: receiverUserDoc._id, group: groupDoc._id },
          {
            $inc: { karma: quantity },
            $push: {
              history: { karmaChange: quantity, timestamp: new Date() },
            },
          },
          { upsert: true, new: true, session },
        );

      if (!receiverKarmaDoc) {
        throw new Error(
          "Critical error: Failed to update receiver's karma document during transaction.",
        );
      }

      await session.commitTransaction();

      await senderKarmaDoc.populate('user');
      await receiverKarmaDoc.populate('user');

      return {
        senderKarma: senderKarmaDoc as unknown as PopulatedKarma,
        receiverKarma: receiverKarmaDoc as unknown as PopulatedKarma,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Transaction aborted due to error: ${error}`);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  public async getTopKarma(groupId: number, ascending = false, limit = 10) {
    const group = await this.groupsService.getGroupInfo(groupId);
    if (!group) return [];
    return this.karmaRepository.findWithPopulatedUser(
      { group: group._id },
      { karma: ascending ? 1 : -1 },
      limit,
    );
  }

  public async getTopGiven(groupId: number, limit = 10) {
    const group = await this.groupsService.getGroupInfo(groupId);
    if (!group) return { topGivenKarma: [], topGivenHate: [] };

    const findTopGivers = (field: 'givenKarma' | 'givenHate') =>
      this.karmaRepository.findWithPopulatedUser(
        { group: group._id, [field]: { $gt: 0 } },
        { [field]: -1 },
        limit,
      );

    const [topGivenKarma, topGivenHate] = await Promise.all([
      findTopGivers('givenKarma'),
      findTopGivers('givenHate'),
    ]);
    return { topGivenKarma, topGivenHate };
  }

  public async getKarmaForUser(
    userId: number,
    chatId: number,
  ): Promise<Karma | null> {
    const [userDoc, groupDoc] = await Promise.all([
      this.usersService.findOne({ userId }),
      this.groupsService.getGroupInfo(chatId),
    ]);
    if (!userDoc || !groupDoc) return null;

    try {
      return await this.karmaRepository.findOne({
        user: userDoc._id,
        group: groupDoc._id,
      });
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }

  public async getTopUsersByKarmaReceived(
    groupId: number,
    daysBack: number,
    limit = 10,
  ): Promise<TopReceivedKarmaDto[]> {
    const group = await this.groupsService.getGroupInfo(groupId);
    if (!group) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    return this.karmaRepository.aggregate<TopReceivedKarmaDto>([
      { $match: { group: group._id } },
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
    ]);
  }

  public async findKarmaByUserQuery(
    input: string,
    groupId: number,
  ): Promise<PopulatedKarma | null> {
    const isUsername = input.startsWith('@');
    const queryValue = isUsername ? input.substring(1) : input;
    const userQuery = isUsername
      ? { userName: new RegExp(`^${queryValue}$`, 'i') }
      : {
          $or: [
            { firstName: new RegExp(`^${queryValue}$`, 'i') },
            { lastName: new RegExp(`^${queryValue}$`, 'i') },
          ],
        };

    const [group, user] = await Promise.all([
      this.groupsService.getGroupInfo(groupId),
      this.usersService.findOne(userQuery),
    ]);

    if (!group || !user) return null;

    return this.karmaRepository.findOneAndPopulate(
      { user: user._id, group: group._id },
      'user',
    ) as Promise<PopulatedKarma | null>;
  }

  public async getTotalUsersAndGroups() {
    const [users, groups] = await Promise.all([
      this.usersService.count(),
      this.groupsService.count(),
    ]);
    return { users, groups };
  }

  public async getGroupsForUser(userId: number): Promise<Group[]> {
    const user = await this.usersService.findOne({ userId });
    if (!user) return [];

    const karmaRecords = await this.karmaRepository.find({ user: user._id });
    if (karmaRecords.length === 0) return [];

    const groupIds = [...new Set(karmaRecords.map((r) => r.group))];

    return this.groupsService.findByIds(groupIds);
  }
}
