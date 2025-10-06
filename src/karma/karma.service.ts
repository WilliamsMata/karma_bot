import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { KarmaRepository } from './karma.repository';
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

    const [, receiverKarma] = await Promise.all([
      this.karmaRepository.updateSenderKarma(
        senderUserDoc._id,
        groupDoc._id,
        incValue,
      ),
      this.karmaRepository.updateReceiverKarma(
        receiverUserDoc._id,
        groupDoc._id,
        incValue,
      ),
    ]);

    if (!receiverKarma) {
      throw new Error('Failed to update receiver karma.');
    }

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
      const senderKarmaDoc =
        await this.karmaRepository.findOneByUserAndGroupForTransaction(
          senderUserDoc._id,
          groupDoc._id,
          session,
        );

      if (!senderKarmaDoc || senderKarmaDoc.karma < quantity) {
        throw new BadRequestException(
          `You don't have enough karma. Your current karma is ${
            senderKarmaDoc?.karma ?? 0
          }.`,
        );
      }

      const { senderKarma, receiverKarma } =
        await this.karmaRepository.executeKarmaTransferInTransaction(
          senderKarmaDoc,
          receiverUserDoc._id,
          quantity,
          session,
        );

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

  public async getTopKarma(groupId: number, ascending = false, limit = 10) {
    const group = await this.groupsService.getGroupInfo(groupId);
    if (!group) return [];
    return this.karmaRepository.findTopKarma(group._id, ascending, limit);
  }

  public async getTopGiven(groupId: number, limit = 10) {
    const group = await this.groupsService.getGroupInfo(groupId);
    if (!group) return { topGivenKarma: [], topGivenHate: [] };

    const [topGivenKarma, topGivenHate] = await Promise.all([
      this.karmaRepository.findTopGivers(group._id, 'givenKarma', limit),
      this.karmaRepository.findTopGivers(group._id, 'givenHate', limit),
    ]);
    return { topGivenKarma, topGivenHate };
  }

  public async getKarmaForUser(
    userId: number,
    chatId: number,
  ): Promise<Karma | null> {
    const [userDoc, groupDoc] = await Promise.all([
      this.usersService.findOneByUserId(userId),
      this.groupsService.getGroupInfo(chatId),
    ]);
    if (!userDoc || !groupDoc) return null;

    return this.karmaRepository.findOneByUserAndGroup(
      userDoc._id,
      groupDoc._id,
    );
  }

  public async getTopUsersByKarmaReceived(
    groupId: number,
    daysBack: number,
    limit = 10,
  ): Promise<TopReceivedKarmaDto[]> {
    const group = await this.groupsService.getGroupInfo(groupId);
    if (!group) return [];
    return this.karmaRepository.findTopReceived(group._id, daysBack, limit);
  }

  public async findKarmaByUserQuery(
    input: string,
    groupId: number,
  ): Promise<PopulatedKarma | null> {
    const [user, group] = await Promise.all([
      this.usersService.findOneByUsernameOrName(input),
      this.groupsService.getGroupInfo(groupId),
    ]);
    if (!group || !user) return null;

    return this.karmaRepository.findOneByUserAndGroupAndPopulate(
      user._id,
      group._id,
    );
  }

  public async getTotalUsersAndGroups() {
    const [users, groups] = await Promise.all([
      this.usersService.count(),
      this.groupsService.count(),
    ]);
    return { users, groups };
  }

  public async getGroupsForUser(userId: number): Promise<Group[]> {
    const user = await this.usersService.findOneByUserId(userId);
    if (!user) return [];

    const karmaRecords = await this.karmaRepository.findByUserId(user._id);
    if (karmaRecords.length === 0) return [];

    const groupIds = [...new Set(karmaRecords.map((r) => r.group))];
    return this.groupsService.findPublicGroupsByIds(groupIds);
  }
}
