import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { AbstractRepository } from '../database/abstract.repository';
import { GroupSettings } from './schemas/group-settings.schema';

@Injectable()
export class GroupSettingsRepository extends AbstractRepository<GroupSettings> {
  protected readonly logger = new Logger(GroupSettingsRepository.name);

  constructor(
    @InjectModel(GroupSettings.name) groupSettingsModel: Model<GroupSettings>,
    @InjectConnection() connection: Connection,
  ) {
    super(groupSettingsModel, connection);
  }

  async findOneByGroupId(groupId: number): Promise<GroupSettings | null> {
    const filterQuery: FilterQuery<GroupSettings> = { groupId };
    return this.findOne(filterQuery).catch(() => null);
  }
}
