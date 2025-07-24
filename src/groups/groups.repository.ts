import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { AbstractRepository } from '../database/abstract.repository';
import { Group } from './schemas/group.schema';

@Injectable()
export class GroupsRepository extends AbstractRepository<Group> {
  protected readonly logger = new Logger(GroupsRepository.name);

  constructor(
    @InjectModel(Group.name) groupModel: Model<Group>,
    @InjectConnection() connection: Connection,
  ) {
    super(groupModel, connection);
  }

  async countDocuments(filterQuery: FilterQuery<Group> = {}): Promise<number> {
    return this.model.countDocuments(filterQuery);
  }
}
