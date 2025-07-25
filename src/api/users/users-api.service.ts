import { Injectable } from '@nestjs/common';
import { KarmaService } from '../../karma/karma.service';
import { Group } from '../../groups/schemas/group.schema';

type UserGroupDto = Omit<Group, '_id' | 'createdAt' | 'updatedAt'>;

@Injectable()
export class UsersApiService {
  constructor(private readonly karmaService: KarmaService) {}

  public async getGroupsForUser(userId: number): Promise<UserGroupDto[]> {
    const groups = await this.karmaService.getGroupsForUser(userId);
    return groups.map(({ _id, ...rest }) => rest);
  }
}
