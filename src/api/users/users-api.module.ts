import { Module } from '@nestjs/common';
import { UsersApiController } from './users-api.controller';
import { KarmaModule } from '../../karma/karma.module';
import { UsersApiService } from './users-api.service';

@Module({
  imports: [KarmaModule],
  controllers: [UsersApiController],
  providers: [UsersApiService],
})
export class UsersApiModule {}
