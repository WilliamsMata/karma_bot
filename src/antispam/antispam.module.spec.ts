import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AntispamModule } from './antispam.module';
import { AntispamService } from './antispam.service';
import { AntispamRepository } from './antispam.repository';
import { KarmaTransaction } from './schemas/karma-transaction.schema';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { UsersRepository } from '../users/users.repository';

@Injectable()
class ConsumerService {
  constructor(public readonly antispamService: AntispamService) {}
}

describe('AntispamModule', () => {
  let moduleRef: TestingModule;
  const modelMock = {} as unknown as Model<KarmaTransaction>;
  const userModelMock = {} as unknown as Model<User>;
  const connectionMock = {} as unknown as ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AntispamModule],
      providers: [ConsumerService],
    })
      .overrideProvider(getModelToken(KarmaTransaction.name))
      .useValue(modelMock)
      .overrideProvider(getModelToken(User.name))
      .useValue(userModelMock)
      .overrideProvider(getConnectionToken())
      .useValue(connectionMock)
      .overrideProvider(UsersService)
      .useValue({} as UsersService)
      .overrideProvider(UsersRepository)
      .useValue({} as UsersRepository)
      .overrideProvider(AntispamRepository)
      .useValue({} as AntispamRepository)
      .compile();
  });

  it('should load module providers', () => {
    expect(moduleRef.get(AntispamService)).toBeInstanceOf(AntispamService);
    expect(moduleRef.get(AntispamRepository)).toBeDefined();
  });

  it('should export services for external consumers', () => {
    const consumer = moduleRef.get(ConsumerService);
    const antispamService = moduleRef.get(AntispamService);

    expect(consumer.antispamService).toBe(antispamService);
  });

  it('should register mongoose models', () => {
    expect(moduleRef.get(getModelToken(KarmaTransaction.name))).toBe(modelMock);
  });
});
