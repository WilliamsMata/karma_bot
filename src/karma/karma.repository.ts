import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  Connection,
  FilterQuery,
  Model,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { AbstractRepository } from '../database/abstract.repository';
import { User } from '../users/schemas/user.schema';
import { Karma } from './schemas/karma.schema';

@Injectable()
export class KarmaRepository extends AbstractRepository<Karma> {
  protected readonly logger = new Logger(KarmaRepository.name);

  constructor(
    @InjectModel(Karma.name) karmaModel: Model<Karma>,
    @InjectConnection() connection: Connection,
  ) {
    super(karmaModel, connection);
  }

  // Método para contar documentos con un filtro opcional
  async findWithPopulatedUser(
    filterQuery: FilterQuery<Karma>,
    sortQuery: { [key: string]: 1 | -1 },
    limit: number,
  ) {
    return this.model
      .find(filterQuery)
      .sort(sortQuery)
      .limit(limit)
      .populate<{ user: User }>('user', 'userId firstName userName')
      .lean();
  }

  async aggregate<T>(pipeline: any[]): Promise<T[]> {
    return this.model.aggregate<T>(pipeline);
  }

  // Método público que encapsula una búsqueda con sesión de transacción
  async findOneWithSession(
    filterQuery: FilterQuery<Karma>,
    session: ClientSession,
  ) {
    return this.model.findOne(filterQuery).session(session);
  }

  // Método público que encapsula una actualización con sesión de transacción
  async findOneAndUpdateWithSession(
    filterQuery: FilterQuery<Karma>,
    updateQuery: UpdateQuery<Karma>,
    options: QueryOptions & { session: ClientSession },
  ) {
    return this.model.findOneAndUpdate(filterQuery, updateQuery, options);
  }

  async findOneAndPopulate(
    filterQuery: FilterQuery<Karma>,
    populatePath: string,
  ): Promise<Karma | null> {
    const document = await this.model
      .findOne(filterQuery)
      .populate(populatePath)
      .lean();

    return document;
  }
}
