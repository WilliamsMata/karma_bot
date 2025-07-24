import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { KarmaService } from '../../karma/karma.service';
import { GroupsService } from '../../groups/groups.service';

@Controller('karma')
export class KarmaApiController {
  constructor(
    private readonly karmaService: KarmaService,
    private readonly groupsService: GroupsService,
  ) {}

  @Get('total')
  async getTotalStats() {
    return this.karmaService.getTotalUsersAndGroups();
  }

  @Get('group/:groupId')
  async getUsersByGroupId(@Param('groupId', ParseIntPipe) groupId: number) {
    const [groupInfo, users] = await Promise.all([
      this.groupsService.getGroupInfo(groupId),
      this.karmaService.getTopKarma(groupId, false, 0),
    ]);

    if (!groupInfo) {
      throw new NotFoundException(`Group with ID ${groupId} not found.`);
    }

    return { groupInfo, users };
  }
}
