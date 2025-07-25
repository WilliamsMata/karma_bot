import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { AbstractRepository } from '../database/abstract.repository';
import { Group } from './schemas/group.schema';

interface ITelegramChat {
  id: number;
  title?: string;
}

@Injectable()
export class GroupsRepository extends AbstractRepository<Group> {
  protected readonly logger = new Logger(GroupsRepository.name);

  constructor(
    @InjectModel(Group.name) groupModel: Model<Group>,
    @InjectConnection() connection: Connection,
  ) {
    super(groupModel, connection);
  }

  async findOrCreate(chatData: ITelegramChat): Promise<Group | null> {
    const filterQuery: FilterQuery<Group> = { groupId: chatData.id };
    const documentToUpsert: UpdateQuery<Group> = {
      $set: { groupName: chatData.title },
    };
    return this.upsert(filterQuery, documentToUpsert);
  }

  async findOneByGroupId(groupId: number): Promise<Group | null> {
    return this.findOne({ groupId }).catch(() => null);
  }

  async findAll(): Promise<Group[]> {
    return this.find({});
  }

  async findByIds(groupIds: any[]): Promise<Group[]> {
    return this.find({ _id: { $in: groupIds } });
  }

  async findPublicByIds(groupIds: any[]): Promise<Group[]> {
    const filterQuery: FilterQuery<Group> = {
      _id: { $in: groupIds },
      groupName: { $exists: true, $ne: null },
    };
    return this.find(filterQuery);
  }

  async countDocuments(filterQuery: FilterQuery<Group> = {}): Promise<number> {
    return this.model.countDocuments(filterQuery);
  }
}
