import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { User } from './schemas/user.schema';
import { ITelegramUser } from '../telegram/telegram.interfaces';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser: User = {
    _id: 'someObjectId',
    userId: 123456789,
    firstName: 'John',
    lastName: 'Doe',
    userName: 'johndoe',
  } as unknown as User;

  const mockUsersRepository = {
    findOrCreate: jest.fn(),
    findOneByUserId: jest.fn(),
    findOneByUsernameOrName: jest.fn(),
    countDocuments: jest.fn(),
    setBanStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOrCreate', () => {
    const telegramUser: ITelegramUser = {
      id: 123456789,
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
    };

    it('should successfully find or create a user', async () => {
      mockUsersRepository.findOrCreate.mockResolvedValue(mockUser);

      const result = await service.findOrCreate(telegramUser);

      expect(mockUsersRepository.findOrCreate).toHaveBeenCalledWith(
        telegramUser,
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user cannot be created or found', async () => {
      mockUsersRepository.findOrCreate.mockResolvedValue(null);

      await expect(service.findOrCreate(telegramUser)).rejects.toThrow(
        `Could not create or find user ${telegramUser.id}`,
      );
    });
  });

  describe('findOneByUserId', () => {
    it('should return a user if found by ID', async () => {
      mockUsersRepository.findOneByUserId.mockResolvedValue(mockUser);

      const result = await service.findOneByUserId(123456789);

      expect(mockUsersRepository.findOneByUserId).toHaveBeenCalledWith(
        123456789,
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUsersRepository.findOneByUserId.mockResolvedValue(null);

      const result = await service.findOneByUserId(999999);

      expect(mockUsersRepository.findOneByUserId).toHaveBeenCalledWith(999999);
      expect(result).toBeNull();
    });
  });

  describe('findOneByUsernameOrName', () => {
    const input = '@johndoe';

    it('should return a user if found by username or name', async () => {
      mockUsersRepository.findOneByUsernameOrName.mockResolvedValue(mockUser);

      const result = await service.findOneByUsernameOrName(input);

      expect(mockUsersRepository.findOneByUsernameOrName).toHaveBeenCalledWith(
        input,
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null if not found', async () => {
      mockUsersRepository.findOneByUsernameOrName.mockResolvedValue(null);

      const result = await service.findOneByUsernameOrName('unknown');

      expect(mockUsersRepository.findOneByUsernameOrName).toHaveBeenCalledWith(
        'unknown',
      );
      expect(result).toBeNull();
    });
  });

  describe('count', () => {
    it('should return the total count of users', async () => {
      mockUsersRepository.countDocuments.mockResolvedValue(10);

      const result = await service.count();

      expect(mockUsersRepository.countDocuments).toHaveBeenCalled();
      expect(result).toBe(10);
    });
  });

  describe('banUser', () => {
    it('should ban a user until a specific date', async () => {
      const banDate = new Date();
      mockUsersRepository.setBanStatus.mockResolvedValue({
        ...mockUser,
        bannedUntil: banDate,
      });

      const result = await service.banUser(mockUser.userId, banDate);

      expect(mockUsersRepository.setBanStatus).toHaveBeenCalledWith(
        mockUser.userId,
        banDate,
      );
      expect(result).toBeDefined();
      expect(result?.bannedUntil).toEqual(banDate);
    });
  });
});
