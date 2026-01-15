import { Logger } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { AntispamRepository } from './antispam.repository';
import { KarmaTransaction } from './schemas/karma-transaction.schema';

describe('AntispamRepository', () => {
  const countDocumentsMock = jest.fn();
  const modelMock = {
    countDocuments: countDocumentsMock,
  } as unknown as Model<KarmaTransaction>;
  const connectionMock = {
    startSession: jest.fn().mockResolvedValue({}),
  } as unknown as Connection;

  let repository: AntispamRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new AntispamRepository(modelMock, connectionMock);
    (repository as unknown as { logger: Logger }).logger = new Logger(
      'AntispamRepositoryTest',
    );
  });

  it('countTransactions should delegate to model', async () => {
    const filter = { sourceUserId: new Types.ObjectId() };
    countDocumentsMock.mockResolvedValueOnce(5);

    const result = await repository.countTransactions(filter);

    expect(countDocumentsMock).toHaveBeenCalledWith(filter);
    expect(result).toBe(5);
  });
});
