import { Module } from '@nestjs/common';
import { KarmaApiController } from './karma-api.controller';
import { KarmaModule } from '../../karma/karma.module';
import { GroupsModule } from '../../groups/groups.module';
import { KarmaApiService } from './karma-api.service';

@Module({
  imports: [KarmaModule, GroupsModule],
  controllers: [KarmaApiController],
  providers: [KarmaApiService],
})
export class KarmaApiModule {}
