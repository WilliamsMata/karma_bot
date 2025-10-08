import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './schemas/group.schema';
import { GroupsRepository } from './groups.repository';
import { GroupsService } from './groups.service';
import {
  GroupSettings,
  GroupSettingsSchema,
} from './schemas/group-settings.schema';
import { GroupSettingsRepository } from './group-settings.repository';
import { GroupSettingsService } from './group-settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: GroupSettings.name, schema: GroupSettingsSchema },
    ]),
  ],
  providers: [
    GroupsRepository,
    GroupsService,
    GroupSettingsRepository,
    GroupSettingsService,
  ],
  exports: [GroupsService, GroupSettingsService],
})
export class GroupsModule {}
