import { Test, TestingModule } from '@nestjs/testing';
import { AntispamService, SpamType } from './antispam.service';
import { AntispamRepository } from './antispam.repository';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';

describe('AntispamService', () => {
  let service: AntispamService;
  let mockAntispamRepository: {
    create: jest.MockedFunction<AntispamRepository['create']>;
    countTransactions: jest.MockedFunction<
      AntispamRepository['countTransactions']
    >;
  };
  let mockUsersService: {
    banUser: jest.MockedFunction<UsersService['banUser']>;
  };

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

  it('logs a transaction', async () => {
    const sourceUserId = new Types.ObjectId();
    const targetUserId = new Types.ObjectId();
    const groupId = new Types.ObjectId();

    await service.logTransaction(sourceUserId, targetUserId, groupId, 'KARMA');

    expect(mockAntispamRepository.create).toHaveBeenCalledWith({
      sourceUserId,
      targetUserId,
      groupId,
      type: 'KARMA',
    });
  });

  describe('checkSpam', () => {
    it('should return BURST if burst threshold is exceeded', async () => {
      mockAntispamRepository.countTransactions.mockResolvedValueOnce(10);

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      expect(result).toBe(SpamType.BURST);
    });

    it('should return DAILY_LIMIT if daily threshold is exceeded', async () => {
      mockAntispamRepository.countTransactions.mockResolvedValueOnce(0);
      mockAntispamRepository.countTransactions.mockResolvedValueOnce(50);

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      expect(result).toBe(SpamType.DAILY_LIMIT);
    });

    it('should return null if no spam detected', async () => {
      mockAntispamRepository.countTransactions.mockResolvedValueOnce(2);
      mockAntispamRepository.countTransactions.mockResolvedValueOnce(20);

      const result = await service.checkSpam(
        new Types.ObjectId(),
        new Types.ObjectId(),
      );

      expect(result).toBeNull();
    });

    it('uses correct windows for burst and daily checks', async () => {
      jest.useFakeTimers();
      const frozen = new Date('2024-01-01T00:00:00Z');
      jest.setSystemTime(frozen);

      const sourceUserId = new Types.ObjectId();
      const targetUserId = new Types.ObjectId();

      mockAntispamRepository.countTransactions.mockResolvedValueOnce(5);
      mockAntispamRepository.countTransactions.mockResolvedValueOnce(60);

      await service.checkSpam(sourceUserId, targetUserId);

      const [burstFilter] = mockAntispamRepository.countTransactions.mock
        .calls[0] as [
        {
          sourceUserId: Types.ObjectId;
          targetUserId: Types.ObjectId;
          timestamp: { $gte: Date };
        },
      ];
      const [dailyFilter] = mockAntispamRepository.countTransactions.mock
        .calls[1] as [
        {
          sourceUserId: Types.ObjectId;
          targetUserId?: Types.ObjectId;
          timestamp: { $gte: Date };
        },
      ];

      expect(burstFilter.sourceUserId).toBe(sourceUserId);
      expect(burstFilter.targetUserId).toBe(targetUserId);
      expect(burstFilter.timestamp.$gte).toEqual(
        new Date('2023-12-31T23:45:00.000Z'),
      );

      expect(dailyFilter.sourceUserId).toBe(sourceUserId);
      expect(dailyFilter.targetUserId).toBeUndefined();
      expect(dailyFilter.timestamp.$gte).toEqual(
        new Date('2023-12-31T00:00:00.000Z'),
      );

      jest.useRealTimers();
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
