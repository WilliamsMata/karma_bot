import { Module } from '@nestjs/common';
import { UsersApiController } from './users-api.controller';
import { KarmaModule } from '../../karma/karma.module';

@Module({
  imports: [KarmaModule],
  controllers: [UsersApiController],
})
export class UsersApiModule {}
