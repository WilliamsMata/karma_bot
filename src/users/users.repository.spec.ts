import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { ITelegramUser } from '../telegram/telegram.interfaces';

describe('UsersRepository', () => {
  let repository: UsersRepository;

  const mockUser = {
    _id: 'someObjectId',
    userId: 123456789,
    firstName: 'John',
    lastName: 'Doe',
    userName: 'johndoe',
    save: jest.fn(),
  };

  const mockUserModel = {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: 'DatabaseConnection',
          useValue: {},
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findOrCreate', () => {
    const telegramUser: ITelegramUser = {
      id: 123456789,
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
    };

    it('should upsert a user correctly', async () => {
      mockUserModel.findOneAndUpdate.mockResolvedValue(mockUser);

      const result = await repository.findOrCreate(telegramUser);

      expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: telegramUser.id },
        {
          $set: {
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
            userName: telegramUser.username,
          },
          $setOnInsert: { userId: telegramUser.id },
        },
        { lean: true, upsert: true, new: true },
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOneByUserId', () => {
    it('should find a user by ID', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await repository.findOneByUserId(123456789);

      expect(mockUserModel.findOne).toHaveBeenCalledWith(
        { userId: 123456789 },
        {},
        { lean: true },
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await repository.findOneByUserId(999);
      expect(result).toBeNull();
    });
  });

  describe('findOneByUsernameOrName', () => {
    it('should search by userName if input starts with @', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      const input = '@johndoe';

      await repository.findOneByUsernameOrName(input);

      expect(mockUserModel.findOne).toHaveBeenCalledWith(
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          userName: expect.any(RegExp),
        },
        {},
        { lean: true },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const callArgs = mockUserModel.findOne.mock.calls[0][0] as {
        userName: RegExp;
      };
      expect(callArgs.userName.source).toContain('johndoe');
    });

    it('should search by firstName or lastName if input does not start with @', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      const input = 'John';

      await repository.findOneByUsernameOrName(input);

      expect(mockUserModel.findOne).toHaveBeenCalledWith(
        {
          $or: [
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { firstName: expect.any(RegExp) },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { lastName: expect.any(RegExp) },
          ],
        },
        {},
        { lean: true },
      );
    });
  });

  describe('countDocuments', () => {
    it('should return count of documents', async () => {
      mockUserModel.countDocuments.mockResolvedValue(5);

      const result = await repository.countDocuments();

      expect(mockUserModel.countDocuments).toHaveBeenCalledWith({});
      expect(result).toBe(5);
    });

    it('should return count with filter', async () => {
      const filter = { userId: 1 };
      mockUserModel.countDocuments.mockResolvedValue(1);

      await repository.countDocuments(filter);

      expect(mockUserModel.countDocuments).toHaveBeenCalledWith(filter);
    });
  });

  describe('setBanStatus', () => {
    it('should update bannedUntil field', async () => {
      const date = new Date();
      mockUserModel.findOneAndUpdate.mockResolvedValue({
        ...mockUser,
        bannedUntil: date,
      });

      const result = await repository.setBanStatus(123, date);

      expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 123 },
        { bannedUntil: date },
        { lean: true, new: true },
      );
      expect(result?.bannedUntil).toEqual(date);
    });
  });
});
