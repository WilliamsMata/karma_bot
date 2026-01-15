import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GroupsModule } from './groups.module';
import { GroupsService } from './groups.service';
import { GroupsRepository } from './groups.repository';
import { Group } from './schemas/group.schema';
import { GroupSettings } from './schemas/group-settings.schema';
import { GroupSettingsRepository } from './group-settings.repository';
import { GroupSettingsService } from './group-settings.service';

@Injectable()
class ConsumerService {
  constructor(
    public readonly groupsService: GroupsService,
    public readonly groupSettingsService: GroupSettingsService,
  ) {}
}

describe('GroupsModule', () => {
  let moduleRef: TestingModule;
  const groupModelMock = {} as unknown as Model<Group>;
  const groupSettingsModelMock = {} as unknown as Model<GroupSettings>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [GroupsModule],
      providers: [ConsumerService],
    })
      .overrideProvider(getModelToken(Group.name))
      .useValue(groupModelMock)
      .overrideProvider(getModelToken(GroupSettings.name))
      .useValue(groupSettingsModelMock)
      .overrideProvider(GroupsRepository)
      .useValue({} as GroupsRepository)
      .overrideProvider(GroupSettingsRepository)
      .useValue({} as GroupSettingsRepository)
      .compile();
  });

  it('should load module providers', () => {
    expect(moduleRef.get(GroupsService)).toBeInstanceOf(GroupsService);
    expect(moduleRef.get(GroupsRepository)).toBeDefined();
    expect(moduleRef.get(GroupSettingsService)).toBeInstanceOf(
      GroupSettingsService,
    );
    expect(moduleRef.get(GroupSettingsRepository)).toBeDefined();
  });

  it('should export services for external consumers', () => {
    const consumer = moduleRef.get(ConsumerService);
    const groupsService = moduleRef.get(GroupsService);
    const settingsService = moduleRef.get(GroupSettingsService);

    expect(consumer.groupsService).toBe(groupsService);
    expect(consumer.groupSettingsService).toBe(settingsService);
  });

  it('should register mongoose models', () => {
    expect(moduleRef.get(getModelToken(Group.name))).toBe(groupModelMock);
    expect(moduleRef.get(getModelToken(GroupSettings.name))).toBe(
      groupSettingsModelMock,
    );
  });
});
