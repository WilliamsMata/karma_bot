import { Injectable } from '@nestjs/common';
import { GroupsRepository } from './groups.repository';
import { Group } from './schemas/group.schema';
import type { ITelegramChat } from '../telegram/telegram.interfaces';
import type { Types } from 'mongoose';
import { GroupSettingsService } from './group-settings.service';
import type { GroupSettings } from './schemas/group-settings.schema';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly groupSettingsService: GroupSettingsService,
  ) {}

  async findOrCreate(chatData: ITelegramChat): Promise<Group> {
    const group = await this.groupsRepository.findOrCreate(chatData);
    if (!group)
      throw new Error(`Could not find or create group ${chatData.id}`);
    await this.groupSettingsService.ensureDefaults(group.groupId);
    return group;
  }

  async findPublicGroupsByIds(groupIds: Types.ObjectId[]): Promise<Group[]> {
    const groupsFromDb = await this.groupsRepository.findPublicByIds(groupIds);
    const filteredGroups = groupsFromDb.filter(
      (g) => g.groupId.toString().length >= 13,
    );
    return filteredGroups;
  }

  async getGroupInfo(groupId: number): Promise<Group | null> {
    const group = await this.groupsRepository.findOneByGroupId(groupId);
    if (group) {
      await this.groupSettingsService.ensureDefaults(group.groupId);
    }
    return group;
  }

  async getDistinctGroupIds(): Promise<number[]> {
    const groups = await this.groupsRepository.findAll();
    return groups.map((g) => g.groupId);
  }

  async count(): Promise<number> {
    return this.groupsRepository.countDocuments();
  }

  async findByIds(groupIds: Types.ObjectId[]): Promise<Group[]> {
    return this.groupsRepository.findByIds(groupIds);
  }

  async getGroupSettings(groupId: number): Promise<GroupSettings> {
    return this.groupSettingsService.ensureDefaults(groupId);
  }
}
