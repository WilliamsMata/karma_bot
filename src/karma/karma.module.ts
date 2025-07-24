import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Karma, KarmaSchema } from './schemas/karma.schema';
import { KarmaRepository } from './karma.repository';
import { KarmaService } from './karma.service';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Karma.name, schema: KarmaSchema }]),
    UsersModule,
    GroupsModule,
  ],
  providers: [KarmaService, KarmaRepository],
  exports: [KarmaService],
})
export class KarmaModule {}
