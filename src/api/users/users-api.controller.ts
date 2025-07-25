import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UsersApiService } from './users-api.service';

@Controller('users')
export class UsersApiController {
  constructor(private readonly usersApiService: UsersApiService) {}

  @Get(':userId/groups')
  async getUserGroups(@Param('userId', ParseIntPipe) userId: number) {
    return this.usersApiService.getGroupsForUser(userId);
  }
}
