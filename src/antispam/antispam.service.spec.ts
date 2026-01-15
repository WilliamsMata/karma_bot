import { Test, TestingModule } from '@nestjs/testing';
import { AntispamService, SpamType } from './antispam.service';
import { AntispamRepository } from './antispam.repository';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';

describe('AntispamService', () => {
  let service: AntispamService;
  let mockAntispamRepository: {
    create: jest.Mock;
    countTransactions: jest.Mock;
  };
  let mockUsersService: { banUser: jest.Mock };

  beforeEach(async () => {
    mockAntispamRepository = {
      create: jest.fn(),
      countTransactions: jest.fn(),
    };

    mockUsersService = {
      banUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AntispamService,
        {
          provide: AntispamRepository,
          useValue: mockAntispamRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AntispamService>(AntispamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkSpam', () => {
    it('should return BURST if burst threshold is exceeded', async () => {
      mockAntispamRepository.countTransactions.mockResolvedValueOnce(10); // Burst count

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      expect(result).toBe(SpamType.BURST);
    });

    it('should return DAILY_LIMIT if daily threshold is exceeded', async () => {
      mockAntispamRepository.countTransactions.mockResolvedValueOnce(0); // Burst count okay
      mockAntispamRepository.countTransactions.mockResolvedValueOnce(50); // Daily count limit

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      expect(result).toBe(SpamType.DAILY_LIMIT);
    });

    it('should return null if no spam detected', async () => {
      mockAntispamRepository.countTransactions.mockResolvedValueOnce(2); // Burst count okay
      mockAntispamRepository.countTransactions.mockResolvedValueOnce(20); // Daily count okay

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      expect(result).toBeNull();
    });
  });

  describe('applyBan', () => {
    it('should call usersService.banUser', async () => {
      await service.applyBan(12345);
      expect(mockUsersService.banUser).toHaveBeenCalledWith(
        12345,
        expect.any(Date),
      );
    });
  });
});
