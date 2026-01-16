import { Logger } from '@nestjs/common';
import { ClientSession, Connection, Model, Types, Document } from 'mongoose';
import { KarmaRepository, KarmaHistoryPayload } from './karma.repository';
import { Karma, KarmaHistory } from './schemas/karma.schema';

const objectId = () => new Types.ObjectId();

describe('KarmaRepository', () => {
  const upsertMock = jest.fn();
  const findMock = jest.fn();
  const findOneMock = jest.fn();
  const aggregateMock = jest.fn();
  const populateFn = jest.fn();
  const saveMock = jest.fn();

  const connectionMock = {
    startSession: jest.fn().mockResolvedValue({} as ClientSession),
  } as unknown as Connection;

  const modelMock = {
    findOne: findOneMock,
    find: findMock,
    aggregate: aggregateMock,
    populate: populateFn,
    findOneAndUpdate: upsertMock,
  } as unknown as Model<Karma>;

  let repository: KarmaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new KarmaRepository(modelMock, connectionMock);
    (repository as unknown as { logger: Logger }).logger = new Logger(
      'KarmaRepositoryTest',
    );
  });

  it('updateSenderKarma increments given counts', async () => {
    upsertMock.mockResolvedValue({} as Karma);
    const senderId = objectId();
    const groupId = objectId();

    await repository.updateSenderKarma({ senderId, groupId, incValue: 1 });
    await repository.updateSenderKarma({ senderId, groupId, incValue: -1 });

    expect(upsertMock).toHaveBeenNthCalledWith(
      1,
      { user: senderId, group: groupId },
      { $inc: { givenKarma: 1 } },
      expect.objectContaining({ session: undefined }),
    );
    expect(upsertMock).toHaveBeenNthCalledWith(
      2,
      { user: senderId, group: groupId },
      { $inc: { givenHate: 1 } },
      expect.objectContaining({ session: undefined }),
    );
  });

  it('updateReceiverKarma increments karma and pushes history', async () => {
    const receiverId = objectId();
    const groupId = objectId();
    const historyEntry = { karmaChange: 1 } as KarmaHistoryPayload;
    upsertMock.mockResolvedValue({ karma: 5 } as Karma);

    await repository.updateReceiverKarma({
      receiverId,
      groupId,
      incValue: 1,
      historyEntry,
    });

    expect(upsertMock).toHaveBeenCalledWith(
      { user: receiverId, group: groupId },
      { $inc: { karma: 1 }, $push: { history: historyEntry } },
      expect.objectContaining({ session: undefined }),
    );
  });

  it('findTopKarma sorts by karma and limits', async () => {
    const execMock = jest.fn().mockResolvedValue([] as Karma[]);
    findMock.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: execMock,
    });

    await repository.findTopKarma({
      groupId: objectId(),
      ascending: true,
      limit: 5,
    });

    const anyObjectId = expect.any(Types.ObjectId) as unknown as Types.ObjectId;

    expect(findMock).toHaveBeenCalledWith({
      group: anyObjectId,
    });
    expect(execMock).toHaveBeenCalled();
  });

  it('findOneByUserAndGroup returns null on error', async () => {
    findOneMock.mockRejectedValue(new Error('fail'));

    await expect(
      repository.findOneByUserAndGroup({
        userId: objectId(),
        groupId: objectId(),
      }),
    ).resolves.toBeNull();
  });

  it('executeKarmaTransferInTransaction updates sender and receiver', async () => {
    const senderDoc = {
      _id: objectId(),
      group: objectId(),
      karma: 5,
      history: [{} as KarmaHistory],
      save: saveMock,
      set: jest.fn(),
      markModified: jest.fn(),
    } as unknown as Document<unknown, unknown, Karma> & Karma;

    saveMock.mockResolvedValue(senderDoc);
    upsertMock.mockResolvedValue({ karma: 7 } as Karma);

    const result = await repository.executeKarmaTransferInTransaction({
      senderKarmaDoc: senderDoc,
      receiverId: objectId(),
      quantity: 3,
      session: {} as ClientSession,
      senderHistory: {
        actor: objectId(),
        karmaChange: -3,
      } as KarmaHistoryPayload,
      receiverHistory: {
        actor: objectId(),
        karmaChange: 3,
      } as KarmaHistoryPayload,
    });

    expect(saveMock).toHaveBeenCalled();
    expect(result.receiverKarma).toEqual({ karma: 7 });
  });

  it('sanitizeHistoryEntries removes invalid entries and logs', () => {
    const setMock = jest.fn();
    const doc = {
      _id: objectId(),
      history: [
        undefined,
        { actor: objectId(), actorFirstName: 'a', actorTelegramId: 1 },
        { actorFirstName: 'missing' } as unknown as KarmaHistory,
      ],
      set: setMock,
      markModified: jest.fn(),
    } as unknown as Document<unknown, unknown, Karma> & Karma;

    (
      repository as unknown as { sanitizeHistoryEntries: (d: Karma) => void }
    ).sanitizeHistoryEntries(doc);

    const actorObjectId = expect.anything() as unknown as Types.ObjectId;

    expect(setMock).toHaveBeenCalledWith('history', [
      {
        actor: actorObjectId,
        actorFirstName: 'a',
        actorTelegramId: 1,
      },
    ]);
  });
});
