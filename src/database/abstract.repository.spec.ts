import { Logger, NotFoundException } from '@nestjs/common';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { AbstractRepository } from './abstract.repository';
import { AbstractDocument } from './abstract.schema';

type TestDoc = AbstractDocument & { name?: string };

class TestRepository extends AbstractRepository<TestDoc> {
  protected readonly logger: Logger;

  constructor(model: Model<TestDoc>, connection: Connection, logger: Logger) {
    super(model, connection);
    this.logger = logger;
  }
}

describe('AbstractRepository', () => {
  const warnMock = jest.fn();
  const errorMock = jest.fn();
  const logger = { warn: warnMock, error: errorMock } as unknown as Logger;

  const saveMock = jest.fn();
  const findOneMock = jest.fn();
  const findOneAndUpdateMock = jest.fn();
  const findMock = jest.fn();

  // Model constructor mock must be callable with `new` and expose query helpers.
  const modelCtor = jest.fn().mockImplementation((doc: Partial<TestDoc>) => ({
    ...doc,
    save: saveMock,
  }));

  const modelMock = Object.assign(modelCtor, {
    findOne: findOneMock,
    findOneAndUpdate: findOneAndUpdateMock,
    find: findMock,
  }) as unknown as Model<TestDoc>;

  const startTransactionMock = jest.fn();
  const withTransactionMock = jest.fn();
  const endSessionMock = jest.fn();

  const sessionMock = {
    startTransaction: startTransactionMock,
    withTransaction: withTransactionMock,
    endSession: endSessionMock,
  } as unknown as ClientSession;

  const connectionMock = {
    startSession: jest.fn().mockResolvedValue(sessionMock),
  } as unknown as Connection & { startSession: jest.Mock };

  let repository: TestRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TestRepository(modelMock, connectionMock, logger);
  });

  describe('create', () => {
    it('should create and return the saved document', async () => {
      const savedDocId = new Types.ObjectId();
      const savedDoc: TestDoc & {
        toJSON: () => { _id: Types.ObjectId; name: string };
      } = {
        _id: savedDocId,
        name: 'alice',
        toJSON: () => ({ _id: savedDocId, name: 'alice' }),
      };
      saveMock.mockResolvedValue(savedDoc);

      const result = await repository.create({ name: 'alice' } as TestDoc);

      expect(modelCtor).toHaveBeenCalledWith({
        name: 'alice',
        _id: expect.any(Types.ObjectId) as unknown as Types.ObjectId,
      });
      expect(saveMock).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ _id: savedDocId, name: 'alice' });
    });
  });

  describe('findOne', () => {
    it('should return a document when found', async () => {
      const doc = { _id: new Types.ObjectId(), name: 'bob' } as TestDoc;
      findOneMock.mockResolvedValue(doc);

      const result = await repository.findOne({ name: 'bob' });

      expect(findOneMock).toHaveBeenCalledWith(
        { name: 'bob' },
        {},
        { lean: true },
      );
      expect(result).toBe(doc);
    });

    it('should throw NotFoundException when no document is found', async () => {
      findOneMock.mockResolvedValue(null);

      await expect(
        repository.findOne({ name: 'missing' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(warnMock).toHaveBeenCalledWith(
        'Document not found with filterQuery',
        { name: 'missing' },
      );
    });
  });

  describe('findOneAndUpdate', () => {
    it('should return the updated document', async () => {
      const updated = { _id: new Types.ObjectId(), name: 'updated' } as TestDoc;
      findOneAndUpdateMock.mockResolvedValue(updated);

      const result = await repository.findOneAndUpdate(
        { _id: '1' },
        { name: 'updated' },
      );

      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
        { _id: '1' },
        { name: 'updated' },
        { lean: true, new: true },
      );
      expect(result).toBe(updated);
    });

    it('should throw NotFoundException when update target is missing', async () => {
      findOneAndUpdateMock.mockResolvedValue(null);

      await expect(
        repository.findOneAndUpdate({ _id: 'missing' }, { name: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(warnMock).toHaveBeenCalledWith(
        'Document not found with filterQuery:',
        { _id: 'missing' },
      );
    });
  });

  describe('upsert', () => {
    it('should call findOneAndUpdate with upsert options', async () => {
      const doc = { _id: new Types.ObjectId(), name: 'carol' } as TestDoc;
      findOneAndUpdateMock.mockResolvedValue(doc);

      const result = await repository.upsert(
        { name: 'carol' },
        { $set: { name: 'carol' } },
      );

      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
        { name: 'carol' },
        { $set: { name: 'carol' } },
        { lean: true, upsert: true, new: true },
      );
      expect(result).toBe(doc);
    });
  });

  describe('find', () => {
    it('should return all matching documents', async () => {
      const docs = [
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
      ] as TestDoc[];
      findMock.mockResolvedValue(docs);

      const result = await repository.find({ name: 'any' }, { limit: 10 });

      expect(findMock).toHaveBeenCalledWith(
        { name: 'any' },
        {},
        { lean: true, limit: 10 },
      );
      expect(result).toBe(docs);
    });
  });

  describe('findById', () => {
    it('should delegate to findOne', async () => {
      const doc = { _id: new Types.ObjectId() } as TestDoc;
      const spy = jest.spyOn(repository, 'findOne').mockResolvedValue(doc);

      const result = await repository.findById('abc');

      expect(spy).toHaveBeenCalledWith({ _id: 'abc' });
      expect(result).toBe(doc);
    });
  });

  describe('findByIds', () => {
    it('should delegate to find with $in filter', async () => {
      const docs = [
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
      ] as TestDoc[];
      const ids = docs.map((d) => d._id.toHexString());
      const spy = jest.spyOn(repository, 'find').mockResolvedValue(docs);

      const result = await repository.findByIds(ids);

      expect(spy).toHaveBeenCalledWith({ _id: { $in: ids } });
      expect(result).toBe(docs);
    });
  });

  describe('startTransaction', () => {
    it('should start a session and transaction', async () => {
      const session = await repository.startTransaction();

      expect(connectionMock.startSession as jest.Mock).toHaveBeenCalled();
      expect(startTransactionMock).toHaveBeenCalled();
      expect(session).toBe(sessionMock);
    });
  });

  describe('runInTransaction', () => {
    it('should execute the operation inside withTransaction and end session', async () => {
      const resultValue = 'ok';
      withTransactionMock.mockImplementation(
        async (cb: (session: ClientSession) => Promise<unknown>) =>
          cb(sessionMock),
      );

      const result = await repository.runInTransaction((session) => {
        expect(session).toBe(sessionMock);
        return Promise.resolve(resultValue);
      });

      expect(connectionMock.startSession).toHaveBeenCalled();
      expect(withTransactionMock).toHaveBeenCalled();
      expect(endSessionMock).toHaveBeenCalled();
      expect(result).toBe(resultValue);
    });

    it('should log and rethrow errors while ending the session', async () => {
      const error = new Error('tx failed');
      withTransactionMock.mockImplementation(() => {
        throw error;
      });

      await expect(
        repository.runInTransaction(() => Promise.resolve('nope')),
      ).rejects.toBe(error);

      expect(errorMock).toHaveBeenCalledWith('Transaction failed', error);
      expect(endSessionMock).toHaveBeenCalled();
    });
  });
});
