import { Injectable, NotFoundException } from '@nestjs/common';
import { KarmaService } from '../../karma/karma.service';
import { GroupsService } from '../../groups/groups.service';
import { GroupUserKarmaDto } from '../../karma/dto/group-user-karma.dto';

@Injectable()
export class KarmaApiService {
  constructor(
    private readonly karmaService: KarmaService,
    private readonly groupsService: GroupsService,
  ) {}

  public async getTotalStats() {
    return this.karmaService.getTotalUsersAndGroups();
  }

  public async getGroupLeaderboard(groupId: number) {
    const [groupInfo, usersFromService] = await Promise.all([
      this.groupsService.getGroupInfo(groupId),
      this.karmaService.getTopKarma(groupId, false, 0),
    ]);

    if (!groupInfo) {
      throw new NotFoundException(`Group with ID ${groupId} not found.`);
    }

    const users: GroupUserKarmaDto[] = usersFromService.map((karmaDoc) => ({
      _id: karmaDoc._id.toString(),
      karma: karmaDoc.karma,
      givenKarma: karmaDoc.givenKarma,
      givenHate: karmaDoc.givenHate,
      userId: karmaDoc.user.userId,
      firstName: karmaDoc.user.firstName,
      lastName: karmaDoc.user.lastName,
      userName: karmaDoc.user.userName,
    }));

    return { groupInfo, users };
  }
}
