import { Logger, NotFoundException } from '@nestjs/common';
import {
  FilterQuery,
  Model,
  Types,
  UpdateQuery,
  SaveOptions,
  Connection,
  ClientSession,
  QueryOptions,
} from 'mongoose';
import { AbstractDocument } from './abstract.schema';

export abstract class AbstractRepository<TDocument extends AbstractDocument> {
  protected abstract readonly logger: Logger;

  constructor(
    protected readonly model: Model<TDocument>,
    private readonly connection: Connection,
  ) {}

  async create(
    document: Omit<TDocument, '_id'>,
    options?: SaveOptions,
  ): Promise<TDocument> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });
    return (
      await createdDocument.save(options)
    ).toJSON() as unknown as TDocument;
  }

  async findOne(
    filterQuery: FilterQuery<TDocument>,
    options?: QueryOptions,
  ): Promise<TDocument | null> {
    const document = await this.model.findOne(
      filterQuery,
      {},
      { lean: true, ...options },
    );

    if (!document) {
      this.logger.warn('Document not found with filterQuery', filterQuery);
      throw new NotFoundException('Document not found.');
    }

    return document as TDocument;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
    options?: QueryOptions,
  ): Promise<TDocument> {
    const document = await this.model.findOneAndUpdate(filterQuery, update, {
      lean: true,
      new: true,
      ...options,
    });

    if (!document) {
      this.logger.warn(`Document not found with filterQuery:`, filterQuery);
      throw new NotFoundException('Document not found.');
    }

    return document as TDocument;
  }

  async upsert(
    filterQuery: FilterQuery<TDocument>,
    document: UpdateQuery<TDocument>,
    options?: QueryOptions,
  ): Promise<TDocument> {
    return this.model.findOneAndUpdate(filterQuery, document, {
      lean: true,
      upsert: true,
      new: true,
      ...options,
    }) as Promise<TDocument>;
  }

  async find(
    filterQuery: FilterQuery<TDocument>,
    options?: QueryOptions,
  ): Promise<TDocument[]> {
    return this.model.find(
      filterQuery,
      {},
      { lean: true, ...options },
    ) as Promise<TDocument[]>;
  }

  async findById(id: string): Promise<TDocument> {
    return this.findOne({ _id: id }) as Promise<TDocument>;
  }

  async findByIds(ids: string[]): Promise<TDocument[]> {
    return this.find({ _id: { $in: ids } });
  }

  async startTransaction(): Promise<ClientSession> {
    const session = await this.connection.startSession();
    session.startTransaction();
    return session;
  }

  async runInTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await this.startTransaction();
    try {
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Transaction aborted', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
