import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { KarmaApiService } from './karma-api.service';

@Controller('karma')
export class KarmaApiController {
  constructor(private readonly karmaApiService: KarmaApiService) {}

  @Get('total')
  async getTotalStats() {
    return this.karmaApiService.getTotalStats();
  }

  @Get('group/:groupId')
  async getUsersByGroupId(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.karmaApiService.getGroupLeaderboard(groupId);
  }
}
