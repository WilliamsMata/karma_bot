import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { KarmaHistoryPayload, KarmaRepository } from './karma.repository';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { Group } from '../groups/schemas/group.schema';
import type {
  ITelegramChat,
  ITelegramUser,
} from '../telegram/telegram.interfaces';
import { Karma } from './schemas/karma.schema';
import { TopReceivedKarmaDto } from './dto/top-received-karma.dto';
import { PopulatedKarma } from './karma.types';
import { Types } from 'mongoose';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class KarmaService {
  private readonly logger = new Logger(KarmaService.name);

  constructor(
    private readonly karmaRepository: KarmaRepository,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  public async updateKarma(params: {
    senderData: ITelegramUser;
    receiverData: ITelegramUser;
    chatData: ITelegramChat;
    incValue: number;
    context?: { messageId?: number; messageDate?: number };
  }) {
    const { senderData, receiverData, chatData, incValue, context } = params;
    const [groupDoc, senderUserDoc, receiverUserDoc] = await Promise.all([
      this.groupsService.findOrCreate(chatData),
      this.usersService.findOrCreate(senderData),
      this.usersService.findOrCreate(receiverData),
    ]);

    const historyEntry = this.buildHistoryEntry({
      actor: senderUserDoc,
      target: receiverUserDoc,
      karmaChange: incValue,
      chatId: chatData.id,
      context,
    });

    const [, receiverKarma] = await Promise.all([
      this.karmaRepository.updateSenderKarma({
        senderId: senderUserDoc._id,
        groupId: groupDoc._id,
        incValue,
      }),
      this.karmaRepository.updateReceiverKarma({
        receiverId: receiverUserDoc._id,
        groupId: groupDoc._id,
        incValue,
        historyEntry,
      }),
    ]);

    if (!receiverKarma) {
      throw new Error('Failed to update receiver karma.');
    }

    const receiverName = receiverUserDoc.userName
      ? `@${receiverUserDoc.userName}`
      : receiverUserDoc.firstName;

    return { receiverName, newKarma: receiverKarma.karma };
  }

  public async transferKarma(params: {
    senderData: ITelegramUser;
    receiverData: ITelegramUser;
    chatData: ITelegramChat;
    quantity: number;
    context?: { messageId?: number; messageDate?: number };
  }): Promise<{ senderKarma: PopulatedKarma; receiverKarma: PopulatedKarma }> {
    const { senderData, receiverData, chatData, quantity, context } = params;
    const [groupDoc, senderUserDoc, receiverUserDoc] = await Promise.all([
      this.groupsService.findOrCreate(chatData),
      this.usersService.findOrCreate(senderData),
      this.usersService.findOrCreate(receiverData),
    ]);

    const session = await this.karmaRepository.startTransaction();
    try {
      const senderKarmaDoc =
        await this.karmaRepository.findOneByUserAndGroupForTransaction({
          userId: senderUserDoc._id,
          groupId: groupDoc._id,
          session,
        });

      if (!senderKarmaDoc || senderKarmaDoc.karma < quantity) {
        throw new BadRequestException(
          `You don't have enough karma. Your current karma is ${
            senderKarmaDoc?.karma ?? 0
          }.`,
        );
      }

      const historyTimestamp = this.resolveTimestamp(context);

      const senderHistory = this.buildHistoryEntry({
        actor: senderUserDoc,
        target: receiverUserDoc,
        karmaChange: -quantity,
        chatId: chatData.id,
        context,
        timestampOverride: historyTimestamp,
      });

      const receiverHistory = this.buildHistoryEntry({
        actor: senderUserDoc,
        target: receiverUserDoc,
        karmaChange: quantity,
        chatId: chatData.id,
        context,
        timestampOverride: historyTimestamp,
      });

      const { senderKarma, receiverKarma } =
        await this.karmaRepository.executeKarmaTransferInTransaction({
          senderKarmaDoc,
          receiverId: receiverUserDoc._id,
          quantity,
          session,
          senderHistory,
          receiverHistory,
        });

      await session.commitTransaction();

      const [populatedSender, populatedReceiver] =
        await this.karmaRepository.populateUsers([senderKarma, receiverKarma]);

      return {
        senderKarma: populatedSender,
        receiverKarma: populatedReceiver,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Transaction aborted due to error: ${error}`);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private buildHistoryEntry(params: {
    actor: User & { _id: Types.ObjectId };
    target: User & { _id: Types.ObjectId };
    karmaChange: number;
    chatId?: number;
    context?: { messageId?: number; messageDate?: number };
    timestampOverride?: Date;
  }): KarmaHistoryPayload {
    const { actor, target, karmaChange, chatId, context, timestampOverride } =
      params;

    const timestamp = timestampOverride ?? this.resolveTimestamp(context);

    return {
      karmaChange,
      timestamp,
      actor: actor._id,
      actorFirstName: actor.firstName,
      actorLastName: actor.lastName,
      actorUserName: actor.userName,
      actorTelegramId: actor.userId,
      targetFirstName: target.firstName,
      targetLastName: target.lastName,
      targetUserName: target.userName,
      targetTelegramId: target.userId,
      messageId: context?.messageId,
      chatId,
    };
  }

  private resolveTimestamp(context?: {
    messageId?: number;
    messageDate?: number;
  }): Date {
    if (context?.messageDate) {
      return new Date(context.messageDate * 1000);
    }
    return new Date();
  }

  public async getTopKarma(params: {
    groupId: number;
    ascending?: boolean;
    limit?: number;
  }) {
    const { groupId, ascending = false, limit = 10 } = params;
    const group = await this.groupsService.getGroupInfo(groupId);
    if (!group) return [];
    return this.karmaRepository.findTopKarma({
      groupId: group._id,
      ascending,
      limit,
    });
  }

  public async getTopGiven(params: { groupId: number; limit?: number }) {
    const { groupId, limit = 10 } = params;
    const group = await this.groupsService.getGroupInfo(groupId);
    if (!group) return { topGivenKarma: [], topGivenHate: [] };

    const [topGivenKarma, topGivenHate] = await Promise.all([
      this.karmaRepository.findTopGivers({
        groupId: group._id,
        field: 'givenKarma',
        limit,
      }),
      this.karmaRepository.findTopGivers({
        groupId: group._id,
        field: 'givenHate',
        limit,
      }),
    ]);
    return { topGivenKarma, topGivenHate };
  }

  public async getKarmaForUser(params: {
    userId: number;
    chatId: number;
  }): Promise<Karma | null> {
    const { userId, chatId } = params;
    const [userDoc, groupDoc] = await Promise.all([
      this.usersService.findOneByUserId(userId),
      this.groupsService.getGroupInfo(chatId),
    ]);
    if (!userDoc || !groupDoc) return null;

    return this.karmaRepository.findOneByUserAndGroup({
      userId: userDoc._id,
      groupId: groupDoc._id,
    });
  }

  public async getTopUsersByKarmaReceived(params: {
    groupId: number;
    daysBack: number;
    limit?: number;
  }): Promise<TopReceivedKarmaDto[]> {
    const { groupId, daysBack, limit = 10 } = params;
    const group = await this.groupsService.getGroupInfo(groupId);
    if (!group) return [];
    return this.karmaRepository.findTopReceived({
      groupId: group._id,
      daysBack,
      limit,
    });
  }

  public async findKarmaByUserQuery(params: {
    input: string;
    groupId: number;
  }): Promise<PopulatedKarma | null> {
    const { input, groupId } = params;
    const [user, group] = await Promise.all([
      this.usersService.findOneByUsernameOrName(input),
      this.groupsService.getGroupInfo(groupId),
    ]);
    if (!group || !user) return null;

    return this.karmaRepository.findOneByUserAndGroupAndPopulate({
      userId: user._id,
      groupId: group._id,
    });
  }

  public async getTotalUsersAndGroups() {
    const [users, groups] = await Promise.all([
      this.usersService.count(),
      this.groupsService.count(),
    ]);
    return { users, groups };
  }

  public async getGroupsForUser(params: { userId: number }): Promise<Group[]> {
    const { userId } = params;
    const user = await this.usersService.findOneByUserId(userId);
    if (!user) return [];

    const karmaRecords = await this.karmaRepository.findByUserId(user._id);
    if (karmaRecords.length === 0) return [];

    const groupIds = [...new Set(karmaRecords.map((r) => r.group))];
    return this.groupsService.findPublicGroupsByIds(groupIds);
  }
}
