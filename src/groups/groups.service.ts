import { Injectable } from '@nestjs/common';
import { GroupsRepository } from './groups.repository';
import { Group } from './schemas/group.schema';

interface ITelegramChat {
  id: number;
  title?: string;
}

@Injectable()
export class GroupsService {
  constructor(private readonly groupsRepository: GroupsRepository) {}

  async findOrCreate(chatData: ITelegramChat): Promise<Group> {
    const group = await this.groupsRepository.findOrCreate(chatData);
    if (!group)
      throw new Error(`Could not find or create group ${chatData.id}`);
    return group;
  }

  async findPublicGroupsByIds(groupIds: any[]): Promise<Group[]> {
    const groupsFromDb = await this.groupsRepository.findPublicByIds(groupIds);
    const filteredGroups = groupsFromDb.filter(
      (g) => g.groupId.toString().length >= 13,
    );
    return filteredGroups;
  }

  async getGroupInfo(groupId: number): Promise<Group | null> {
    return this.groupsRepository.findOneByGroupId(groupId);
  }

  async getDistinctGroupIds(): Promise<number[]> {
    const groups = await this.groupsRepository.findAll();
    return groups.map((g) => g.groupId);
  }

  async count(): Promise<number> {
    return this.groupsRepository.countDocuments();
  }

  async findByIds(groupIds: any[]): Promise<Group[]> {
    return this.groupsRepository.findByIds(groupIds);
  }
}
