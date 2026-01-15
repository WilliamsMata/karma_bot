import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { User } from './schemas/user.schema';

@Injectable()
class ConsumerService {
  constructor(public readonly usersService: UsersService) {}
}

describe('UsersModule', () => {
  let moduleRef: TestingModule;
  let repositoryMock: UsersRepository;

  const modelMock = {};
  const connectionMock = {};

  beforeEach(async () => {
    repositoryMock = new UsersRepository(
      modelMock as never,
      connectionMock as never,
    );

    moduleRef = await Test.createTestingModule({
      imports: [UsersModule],
      providers: [
        ConsumerService,
        {
          provide: getConnectionToken(),
          useValue: connectionMock,
        },
      ],
    })
      .overrideProvider(UsersRepository)
      .useValue(repositoryMock)
      .overrideProvider(getModelToken(User.name))
      .useValue(modelMock)
      .compile();
  });

  it('should be defined', () => {
    expect(moduleRef).toBeDefined();
  });

  it('should provide the service and repository', () => {
    const service = moduleRef.get<UsersService>(UsersService);
    const repository = moduleRef.get<UsersRepository>(UsersRepository);

    expect(service).toBeInstanceOf(UsersService);
    expect(repository).toBeInstanceOf(UsersRepository);
  });

  it('should export UsersService for external consumers', () => {
    const consumer = moduleRef.get<ConsumerService>(ConsumerService);
    const service = moduleRef.get<UsersService>(UsersService);

    expect(consumer.usersService).toBe(service);
  });

  it('should register the User model provider', () => {
    const modelToken = getModelToken(User.name);
    const providedModel = moduleRef.get<typeof modelMock>(modelToken);

    expect(providedModel).toBe(modelMock);
  });
});
