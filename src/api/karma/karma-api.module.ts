import { Module } from '@nestjs/common';
import { KarmaApiController } from './karma-api.controller';
import { KarmaModule } from '../../karma/karma.module';
import { GroupsModule } from '../../groups/groups.module';

@Module({
  imports: [KarmaModule, GroupsModule],
  controllers: [KarmaApiController],
})
export class KarmaApiModule {}
