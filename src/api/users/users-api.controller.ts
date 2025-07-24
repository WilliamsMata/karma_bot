import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { KarmaService } from '../../karma/karma.service';

@Controller('users')
export class UsersApiController {
  constructor(private readonly karmaService: KarmaService) {}

  @Get(':userId/groups')
  async getUserGroups(@Param('userId', ParseIntPipe) userId: number) {
    const groups = await this.karmaService.getGroupsForUser(userId);

    return groups.map(({ _id, ...rest }) => rest);
  }
}
