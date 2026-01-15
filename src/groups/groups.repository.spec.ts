import { Logger } from '@nestjs/common';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { GroupsRepository } from './groups.repository';
import { Group } from './schemas/group.schema';
import type { ITelegramChat } from '../telegram/telegram.interfaces';

describe('GroupsRepository', () => {
  const warnMock = jest.fn();
  const logger = { warn: warnMock } as unknown as Logger;

  const findOneAndUpdateMock = jest.fn();
  const findOneMock = jest.fn();
  const findMock = jest.fn();
  const countDocumentsMock = jest.fn();

  const modelCtor = jest.fn().mockImplementation((doc: Partial<Group>) => ({
    ...doc,
  }));

  const modelMock = Object.assign(modelCtor, {
    findOneAndUpdate: findOneAndUpdateMock,
    findOne: findOneMock,
    find: findMock,
    countDocuments: countDocumentsMock,
  }) as unknown as Model<Group>;

  const connectionMock = {
    startSession: jest.fn().mockResolvedValue({} as ClientSession),
  } as unknown as Connection;

  let repository: GroupsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new GroupsRepository(modelMock, connectionMock);
    (repository as unknown as { logger: Logger }).logger = logger;
  });

  it('findOrCreate should upsert by groupId and title', async () => {
    const chat: ITelegramChat = { id: 123, title: 'chat' };
    const doc = { _id: new Types.ObjectId(), groupId: 123 } as Group;
    findOneAndUpdateMock.mockResolvedValue(doc);

    const result = await repository.findOrCreate(chat);

    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { groupId: chat.id },
      { $set: { groupName: chat.title } },
      { lean: true, upsert: true, new: true },
    );
    expect(result).toBe(doc);
  });

  it('findOneByGroupId should return doc or null', async () => {
    const doc = { _id: new Types.ObjectId(), groupId: 5 } as Group;
    findOneMock.mockResolvedValueOnce(doc).mockResolvedValueOnce(null);

    await expect(repository.findOneByGroupId(5)).resolves.toBe(doc);
    await expect(repository.findOneByGroupId(6)).resolves.toBeNull();
  });

  it('findAll should return all docs', async () => {
    const docs = [{ _id: new Types.ObjectId() }] as Group[];
    findMock.mockResolvedValue(docs);

    const result = await repository.findAll();

    expect(findMock).toHaveBeenCalledWith({}, {}, { lean: true });
    expect(result).toBe(docs);
  });

  it('findByIds should filter by $in list', async () => {
    const ids = [new Types.ObjectId(), new Types.ObjectId()];
    const docs = ids.map((id) => ({ _id: id }) as Group);
    findMock.mockResolvedValue(docs);

    const result = await repository.findByIds(ids);

    expect(findMock).toHaveBeenCalledWith(
      { _id: { $in: ids } },
      {},
      { lean: true },
    );
    expect(result).toBe(docs);
  });

  it('findPublicByIds should add groupName existence filter', async () => {
    const ids = [new Types.ObjectId(), new Types.ObjectId()];
    const docs = ids.map((id) => ({ _id: id, groupName: 'x' }) as Group);
    findMock.mockResolvedValue(docs);

    const result = await repository.findPublicByIds(ids);

    expect(findMock).toHaveBeenCalledWith(
      { _id: { $in: ids }, groupName: { $exists: true, $ne: null } },
      {},
      { lean: true },
    );
    expect(result).toBe(docs);
  });

  it('countDocuments should delegate to model', async () => {
    countDocumentsMock.mockResolvedValueOnce(3);
    await expect(repository.countDocuments()).resolves.toBe(3);
    expect(countDocumentsMock).toHaveBeenCalledWith({});

    const filter = { groupId: 1 };
    countDocumentsMock.mockResolvedValueOnce(1);
    await expect(repository.countDocuments(filter)).resolves.toBe(1);
    expect(countDocumentsMock).toHaveBeenCalledWith(filter);
  });
});
