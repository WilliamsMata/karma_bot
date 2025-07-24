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

  public async findPublicGroupsByIds(groupIds: any[]): Promise<Group[]> {
    const groupsFromDb = await this.groupsRepository.find({
      _id: { $in: groupIds },
      groupName: { $exists: true, $ne: null },
    });

    // Filter out groups with invalid IDs (less than 13 characters)
    const filteredGroups = groupsFromDb.filter(
      (g) => g.groupId.toString().length >= 13,
    );

    return filteredGroups;
  }

  async findOrCreate(chatData: ITelegramChat): Promise<Group> {
    const group = await this.groupsRepository.upsert(
      { groupId: chatData.id },
      { $set: { groupName: chatData.title } },
    );
    if (!group)
      throw new Error(`Could not find or create group ${chatData.id}`);
    return group;
  }

  async getGroupInfo(groupId: number): Promise<Group | null> {
    return this.groupsRepository.findOne({ groupId });
  }

  async getDistinctGroupIds(): Promise<number[]> {
    const groups = await this.groupsRepository.find({});
    return groups.map((g) => g.groupId);
  }

  async count(): Promise<number> {
    return this.groupsRepository.countDocuments();
  }

  async findByIds(groupIds: any[]): Promise<Group[]> {
    return this.groupsRepository.find({ _id: { $in: groupIds } });
  }
}
