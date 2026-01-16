import { Test, TestingModule } from '@nestjs/testing';
import { AntispamService, SpamType } from './antispam.service';
import { AntispamRepository } from './antispam.repository';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';
import { KarmaTransaction } from './schemas/karma-transaction.schema';

describe('AntispamService', () => {
  let service: AntispamService;
  let mockAntispamRepository: {
    create: jest.MockedFunction<AntispamRepository['create']>;
    findLastTransactions: jest.MockedFunction<
      AntispamRepository['findLastTransactions']
    >;
  };
  let mockUsersService: {
    banUser: jest.MockedFunction<UsersService['banUser']>;
  };

  beforeEach(async () => {
    mockAntispamRepository = {
      create: jest.fn(),
      findLastTransactions: jest.fn(),
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

  const createTransactions = (
    count: number,
    minutesAgo: number,
  ): KarmaTransaction[] => {
    const txs: KarmaTransaction[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date();
      d.setMinutes(d.getMinutes() - minutesAgo);
      txs.push({ timestamp: d } as KarmaTransaction);
    }
    return txs;
  };

  describe('checkSpam', () => {
    it('detects BURST 30 in 60m', async () => {
      // Return 30 transactions from 1 min ago
      mockAntispamRepository.findLastTransactions.mockResolvedValueOnce(
        createTransactions(30, 1),
      );

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      expect(result).toEqual({
        type: SpamType.BURST,
        penalty: 30,
      });
    });

    it('detects BURST 10 in 15m', async () => {
      // First call is for target (max threshold 30).
      // We simulate we only have 10 transactions, all recent (1 min ago)
      mockAntispamRepository.findLastTransactions.mockResolvedValueOnce(
        createTransactions(10, 1),
      );

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      expect(result).toEqual({
        type: SpamType.BURST,
        penalty: 10,
      });
    });

    it('detects BURST 5 in 7m', async () => {
      mockAntispamRepository.findLastTransactions.mockResolvedValueOnce(
        createTransactions(5, 1),
      );

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      expect(result).toEqual({
        type: SpamType.BURST,
        penalty: 5,
      });
    });

    it('detects DAILY LIMIT 50 in 24h', async () => {
      // Target checks return nothing relevant (empty or old)
      mockAntispamRepository.findLastTransactions.mockResolvedValueOnce([]);

      // Global check returns 50 recent transactions
      mockAntispamRepository.findLastTransactions.mockResolvedValueOnce(
        createTransactions(50, 60), // 1 hour ago
      );

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      expect(result).toEqual({
        type: SpamType.DAILY_LIMIT,
        penalty: 0,
      });
    });

    it('returns null if no threshold met', async () => {
      // Target check: have 5 transactions but very old (600 mins ago)
      mockAntispamRepository.findLastTransactions.mockResolvedValueOnce(
        createTransactions(5, 600),
      );
      // Global check: have 0 transactions
      mockAntispamRepository.findLastTransactions.mockResolvedValueOnce([]);

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      expect(result).toBeNull();
    });

    it('prioritizes higher bursts (target checks logic)', async () => {
      // If we have 30 transactions recent, it hits the 30/60m rule first because of order
      mockAntispamRepository.findLastTransactions.mockResolvedValueOnce(
        createTransactions(30, 2),
      );

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      // Should hit the first rule defined in the array
      expect(result).toEqual({ type: SpamType.BURST, penalty: 30 });
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
