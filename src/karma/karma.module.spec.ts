import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KarmaModule } from './karma.module';
import { KarmaService } from './karma.service';
import { KarmaRepository } from './karma.repository';
import { Karma } from './schemas/karma.schema';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { AntispamService } from '../antispam/antispam.service';
import { User } from '../users/schemas/user.schema';
import { Group } from '../groups/schemas/group.schema';
import { GroupSettings } from '../groups/schemas/group-settings.schema';
import { UsersRepository } from '../users/users.repository';
import { GroupsRepository } from '../groups/groups.repository';
import { GroupSettingsRepository } from '../groups/group-settings.repository';
import { GroupSettingsService } from '../groups/group-settings.service';
import { AntispamRepository } from '../antispam/antispam.repository';
import { KarmaTransaction } from '../antispam/schemas/karma-transaction.schema';

@Injectable()
class ConsumerService {
  constructor(public readonly karmaService: KarmaService) {}
}

describe('KarmaModule', () => {
  let moduleRef: TestingModule;
  const karmaModelMock = {} as unknown as Model<Karma>;
  const userModelMock = {} as unknown as Model<User>;
  const groupModelMock = {} as unknown as Model<Group>;
  const groupSettingsModelMock = {} as unknown as Model<GroupSettings>;
  const karmaTransactionModelMock = {} as unknown as Model<KarmaTransaction>;
  const connectionMock = {} as unknown as ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [KarmaModule],
      providers: [
        ConsumerService,
        { provide: getConnectionToken(), useValue: connectionMock },
      ],
    })
      .overrideProvider(getModelToken(Karma.name))
      .useValue(karmaModelMock)
      .overrideProvider(getModelToken(User.name))
      .useValue(userModelMock)
      .overrideProvider(getModelToken(Group.name))
      .useValue(groupModelMock)
      .overrideProvider(getModelToken(GroupSettings.name))
      .useValue(groupSettingsModelMock)
      .overrideProvider(getModelToken(KarmaTransaction.name))
      .useValue(karmaTransactionModelMock)
      .overrideProvider(UsersService)
      .useValue({} as UsersService)
      .overrideProvider(GroupsService)
      .useValue({} as GroupsService)
      .overrideProvider(AntispamService)
      .useValue({} as AntispamService)
      .overrideProvider(AntispamRepository)
      .useValue({} as AntispamRepository)
      .overrideProvider(UsersRepository)
      .useValue({} as UsersRepository)
      .overrideProvider(GroupsRepository)
      .useValue({} as GroupsRepository)
      .overrideProvider(GroupSettingsRepository)
      .useValue({} as GroupSettingsRepository)
      .overrideProvider(GroupSettingsService)
      .useValue({} as GroupSettingsService)
      .overrideProvider(KarmaRepository)
      .useValue({} as KarmaRepository)
      .compile();
  });

  it('should load module providers', () => {
    expect(moduleRef.get(KarmaService)).toBeInstanceOf(KarmaService);
    expect(moduleRef.get(KarmaRepository)).toBeDefined();
  });

  it('should export services for external consumers', () => {
    const consumer = moduleRef.get(ConsumerService);
    const karmaService = moduleRef.get(KarmaService);

    expect(consumer.karmaService).toBe(karmaService);
  });

  it('should register mongoose models', () => {
    expect(moduleRef.get(getModelToken(Karma.name))).toBe(karmaModelMock);
  });
});
