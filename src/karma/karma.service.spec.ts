import { BadRequestException } from '@nestjs/common';
import { Types, type ClientSession } from 'mongoose';
import { KarmaService } from './karma.service';
import { KarmaRepository } from './karma.repository';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { AntispamService, SpamType } from '../antispam/antispam.service';
import type {
  ITelegramChat,
  ITelegramUser,
} from '../telegram/telegram.interfaces';
import { Group } from '../groups/schemas/group.schema';
import { User } from '../users/schemas/user.schema';
import { Karma } from './schemas/karma.schema';
import type { KarmaDocument } from './karma.repository';
import { PopulatedKarma } from './karma.types';

const chat: ITelegramChat = { id: 1, title: 'chat' };
const sender: ITelegramUser = {
  id: 10,
  first_name: 'S',
  last_name: 'L',
  username: 's',
};
const receiver: ITelegramUser = {
  id: 20,
  first_name: 'R',
  last_name: 'L',
  username: 'r',
};

const userDoc = (id: number): User => ({
  _id: new Types.ObjectId(),
  userId: id,
  firstName: id === 10 ? 'S' : 'R',
  userName: id === 10 ? 's' : 'r',
});

const groupDoc: Group = {
  _id: new Types.ObjectId(),
  groupId: 1,
};

const karmaDoc = (overrides?: Partial<Karma>): KarmaDocument =>
  ({
    _id: new Types.ObjectId(),
    user: new Types.ObjectId(),
    group: groupDoc._id,
    karma: 0,
    history: [],
    givenKarma: 0,
    givenHate: 0,
    ...overrides,
  }) as KarmaDocument;

describe('KarmaService', () => {
  let service: KarmaService;
  let karmaRepository: jest.Mocked<KarmaRepository>;
  let usersService: jest.Mocked<UsersService>;
  let groupsService: jest.Mocked<GroupsService>;
  let antispamService: jest.Mocked<AntispamService>;
  let applyBanMock: jest.Mock;
  let updateReceiverKarmaMock: jest.Mock;

  beforeEach(() => {
    updateReceiverKarmaMock = jest.fn();
    karmaRepository = {
      runInTransaction: jest.fn(),
      updateSenderKarma: jest.fn(),
      updateReceiverKarma: updateReceiverKarmaMock,
      findOneByUserAndGroupForTransaction: jest.fn(),
      executeKarmaTransferInTransaction: jest.fn(),
      populateUsers: jest.fn(),
      findTopKarma: jest.fn(),
      findTopGivers: jest.fn(),
      findOneByUserAndGroup: jest.fn(),
      findTopReceived: jest.fn(),
      findOneByUserAndGroupAndPopulate: jest.fn(),
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<KarmaRepository>;

    applyBanMock = jest.fn();
    usersService = {
      findOrCreate: jest.fn(),
      findOneByUserId: jest.fn(),
      findOneByUsernameOrName: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    groupsService = {
      findOrCreate: jest.fn(),
      getGroupInfo: jest.fn(),
      findPublicGroupsByIds: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<GroupsService>;

    antispamService = {
      checkSpam: jest.fn(),
      applyBan: applyBanMock,
      logTransaction: jest.fn(),
    } as unknown as jest.Mocked<AntispamService>;

    service = new KarmaService(
      karmaRepository,
      usersService,
      groupsService,
      antispamService,
    );
  });

  describe('updateKarma', () => {
    it('throws when receiver not found', async () => {
      groupsService.findOrCreate.mockResolvedValue(groupDoc);
      usersService.findOrCreate
        .mockResolvedValueOnce(userDoc(10))
        .mockResolvedValueOnce(null as unknown as User);

      await expect(
        service.updateKarma({
          senderData: sender,
          receiverData: receiver,
          chatData: chat,
          incValue: 1,
        }),
      ).rejects.toThrow('Receiver not found');
    });

    it('throws when sender banned', async () => {
      groupsService.findOrCreate.mockResolvedValue(groupDoc);
      usersService.findOrCreate.mockResolvedValueOnce({
        ...userDoc(10),
        bannedUntil: new Date(Date.now() + 1000),
      });
      usersService.findOrCreate.mockResolvedValueOnce(userDoc(20));

      await expect(
        service.updateKarma({
          senderData: sender,
          receiverData: receiver,
          chatData: chat,
          incValue: 1,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('applies burst spam penalty and bans', async () => {
      groupsService.findOrCreate.mockResolvedValue(groupDoc);
      const senderDoc = userDoc(10);
      const receiverDoc = userDoc(20);
      usersService.findOrCreate
        .mockResolvedValueOnce(senderDoc)
        .mockResolvedValueOnce(receiverDoc);
      antispamService.checkSpam.mockResolvedValue(SpamType.BURST);

      karmaRepository.updateReceiverKarma.mockResolvedValue(
        karmaDoc({ user: receiverDoc._id, karma: 0 }),
      );

      await expect(
        service.updateKarma({
          senderData: sender,
          receiverData: receiver,
          chatData: chat,
          incValue: 1,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(applyBanMock).toHaveBeenCalledWith(sender.id);
      expect(updateReceiverKarmaMock).toHaveBeenCalledTimes(2);
    });

    it('applies daily spam ban and throws', async () => {
      groupsService.findOrCreate.mockResolvedValue(groupDoc);
      const senderDoc = userDoc(10);
      const receiverDoc = userDoc(20);
      usersService.findOrCreate
        .mockResolvedValueOnce(senderDoc)
        .mockResolvedValueOnce(receiverDoc);
      antispamService.checkSpam.mockResolvedValue(SpamType.DAILY_LIMIT);

      await expect(
        service.updateKarma({
          senderData: sender,
          receiverData: receiver,
          chatData: chat,
          incValue: -1,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const applyBanMock = antispamService.applyBan as jest.Mock;
      expect(applyBanMock).toHaveBeenCalledWith(sender.id);
    });

    it('updates karma and logs transaction', async () => {
      groupsService.findOrCreate.mockResolvedValue(groupDoc);
      const senderDoc = userDoc(10);
      const receiverDoc = userDoc(20);
      usersService.findOrCreate
        .mockResolvedValueOnce(senderDoc)
        .mockResolvedValueOnce(receiverDoc);
      antispamService.checkSpam.mockResolvedValue(null);

      karmaRepository.runInTransaction.mockImplementation(async (cb) =>
        cb({} as ClientSession),
      );
      karmaRepository.updateSenderKarma.mockResolvedValue(
        karmaDoc({ user: senderDoc._id, karma: 4 }),
      );
      karmaRepository.updateReceiverKarma.mockResolvedValue(
        karmaDoc({ user: receiverDoc._id, karma: 5 }),
      );

      await service.updateKarma({
        senderData: sender,
        receiverData: receiver,
        chatData: chat,
        incValue: 1,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const updateSenderMock = karmaRepository.updateSenderKarma as jest.Mock;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const logTransactionMock = antispamService.logTransaction as jest.Mock;

      expect(updateSenderMock).toHaveBeenCalled();
      expect(logTransactionMock).toHaveBeenCalledWith(
        senderDoc._id,
        receiverDoc._id,
        groupDoc._id,
        'KARMA',
      );
    });
  });

  describe('transferKarma', () => {
    it('throws when sender has insufficient karma', async () => {
      groupsService.findOrCreate.mockResolvedValue(groupDoc);
      const senderDoc = userDoc(10);
      const receiverDoc = userDoc(20);
      usersService.findOrCreate
        .mockResolvedValueOnce(senderDoc)
        .mockResolvedValueOnce(receiverDoc);

      karmaRepository.runInTransaction.mockImplementation(async (cb) => {
        const session = {} as ClientSession;
        await cb(session);
        return karmaDoc();
      });

      karmaRepository.findOneByUserAndGroupForTransaction.mockResolvedValue(
        karmaDoc({ user: senderDoc._id }),
      );

      await expect(
        service.transferKarma({
          senderData: sender,
          receiverData: receiver,
          chatData: chat,
          quantity: 5,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('transfers karma and populates users', async () => {
      groupsService.findOrCreate.mockResolvedValue(groupDoc);
      const senderDoc = userDoc(10);
      const receiverDoc = userDoc(20);
      usersService.findOrCreate
        .mockResolvedValueOnce(senderDoc)
        .mockResolvedValueOnce(receiverDoc);

      const senderKarmaDoc = karmaDoc({ user: senderDoc._id, karma: 10 });
      karmaRepository.findOneByUserAndGroupForTransaction.mockResolvedValue(
        senderKarmaDoc,
      );
      karmaRepository.executeKarmaTransferInTransaction.mockResolvedValue({
        senderKarma: senderKarmaDoc,
        receiverKarma: karmaDoc({ user: receiverDoc._id, karma: 15 }),
      });
      karmaRepository.populateUsers.mockResolvedValue([
        { karma: 5 } as PopulatedKarma,
        { karma: 15 } as PopulatedKarma,
      ]);

      karmaRepository.runInTransaction.mockImplementation(async (cb) =>
        cb({} as ClientSession),
      );

      const result = await service.transferKarma({
        senderData: sender,
        receiverData: receiver,
        chatData: chat,
        quantity: 5,
      });

      expect(result.receiverKarma.karma).toBe(15);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const populateUsersMock = karmaRepository.populateUsers as jest.Mock;
      expect(populateUsersMock).toHaveBeenCalled();
    });
  });

  it('getTopKarma returns [] when no group', async () => {
    groupsService.getGroupInfo.mockResolvedValue(null);
    await expect(service.getTopKarma({ groupId: 1 })).resolves.toEqual([]);
  });

  it('getKarmaForUser returns null when user or group missing', async () => {
    usersService.findOneByUserId.mockResolvedValue(null);
    groupsService.getGroupInfo.mockResolvedValue(null);
    await expect(
      service.getKarmaForUser({ userId: 1, chatId: 1 }),
    ).resolves.toBeNull();
  });

  it('getTopUsersByKarmaReceived returns [] when no group', async () => {
    groupsService.getGroupInfo.mockResolvedValue(null);
    await expect(
      service.getTopUsersByKarmaReceived({ groupId: 1, daysBack: 7 }),
    ).resolves.toEqual([]);
  });

  it('findKarmaByUserQuery returns null without matches', async () => {
    usersService.findOneByUsernameOrName.mockResolvedValue(null);
    groupsService.getGroupInfo.mockResolvedValue(null);
    await expect(
      service.findKarmaByUserQuery({ input: 'x', groupId: 1 }),
    ).resolves.toBeNull();
  });

  it('getTotalUsersAndGroups returns aggregated counts', async () => {
    usersService.count.mockResolvedValue(2);
    groupsService.count.mockResolvedValue(3);
    await expect(service.getTotalUsersAndGroups()).resolves.toEqual({
      users: 2,
      groups: 3,
    });
  });

  it('getGroupsForUser returns public groups', async () => {
    usersService.findOneByUserId.mockResolvedValue(userDoc(10));
    karmaRepository.findByUserId.mockResolvedValue([
      karmaDoc({ group: new Types.ObjectId() }),
      karmaDoc({ group: new Types.ObjectId() }),
    ]);
    groupsService.findPublicGroupsByIds.mockResolvedValue([
      { _id: 1 as unknown as Types.ObjectId, groupId: 1 } as Group,
    ]);

    const result = await service.getGroupsForUser({ userId: 1 });
    expect(result).toEqual([
      expect.objectContaining({
        _id: 1 as unknown as Types.ObjectId,
        groupId: 1,
      }),
    ]);
  });
});
