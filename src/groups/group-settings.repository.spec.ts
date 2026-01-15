import { Logger } from '@nestjs/common';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { GroupSettingsRepository } from './group-settings.repository';
import { GroupSettings } from './schemas/group-settings.schema';

describe('GroupSettingsRepository', () => {
  const warnMock = jest.fn();
  const logger = { warn: warnMock } as unknown as Logger;

  const findOneMock = jest.fn();

  const modelCtor = jest
    .fn()
    .mockImplementation((doc: Partial<GroupSettings>) => ({
      ...doc,
    }));

  const modelMock = Object.assign(modelCtor, {
    findOne: findOneMock,
  }) as unknown as Model<GroupSettings>;

  const connectionMock = {
    startSession: jest.fn().mockResolvedValue({} as ClientSession),
  } as unknown as Connection;

  let repository: GroupSettingsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new GroupSettingsRepository(modelMock, connectionMock);
    (repository as unknown as { logger: Logger }).logger = logger;
  });

  it('findOneByGroupId should return doc or null', async () => {
    const doc = { _id: new Types.ObjectId(), groupId: 5 } as GroupSettings;
    findOneMock.mockResolvedValueOnce(doc).mockResolvedValueOnce(null);

    await expect(repository.findOneByGroupId(5)).resolves.toBe(doc);
    await expect(repository.findOneByGroupId(6)).resolves.toBeNull();
  });
});
