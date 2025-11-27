import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException } from '@nestjs/common';
import { PlanType, SubscriptionStatus } from '@prisma/client';

const mockPrismaService = {
  subscriptionPlans: {
    findUnique: jest.fn(),
  },
  bandSubscriptions: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  membersofBands: {
    count: jest.fn(),
  },
  songs: {
    count: jest.fn(),
  },
  events: {
    count: jest.fn(),
  },
};

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTrialSubscription', () => {
    it('should create a trial subscription for a new band', async () => {
      const bandId = 1;
      const trialPlan = { id: 1, type: PlanType.TRIAL, durationDays: 15 };
      mockPrismaService.subscriptionPlans.findUnique.mockResolvedValue(trialPlan);
      mockPrismaService.bandSubscriptions.create.mockResolvedValue({
        id: 1,
        bandId,
        planId: trialPlan.id,
        status: SubscriptionStatus.TRIAL,
      });

      const result = await service.createTrialSubscription(bandId, false);

      expect(result).toBeDefined();
      expect(mockPrismaService.subscriptionPlans.findUnique).toHaveBeenCalledWith({
        where: { type: PlanType.TRIAL },
      });
      expect(mockPrismaService.bandSubscriptions.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if trial plan is not found', async () => {
      mockPrismaService.subscriptionPlans.findUnique.mockResolvedValue(null);

      await expect(service.createTrialSubscription(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkPlanLimits', () => {
    it('should return true if limit is not reached', async () => {
      const bandId = 1;
      const subscription = {
        status: SubscriptionStatus.ACTIVE,
        plan: { maxMembers: 10 },
      };
      mockPrismaService.bandSubscriptions.findUnique.mockResolvedValue(subscription);
      mockPrismaService.membersofBands.count.mockResolvedValue(5);

      const result = await service.checkPlanLimits(bandId, 'maxMembers');

      expect(result).toBe(true);
    });

    it('should return false if limit is reached', async () => {
      const bandId = 1;
      const subscription = {
        status: SubscriptionStatus.ACTIVE,
        plan: { maxMembers: 10 },
      };
      mockPrismaService.bandSubscriptions.findUnique.mockResolvedValue(subscription);
      mockPrismaService.membersofBands.count.mockResolvedValue(10);

      const result = await service.checkPlanLimits(bandId, 'maxMembers');

      expect(result).toBe(false);
    });

    it('should return false if subscription is expired', async () => {
      const bandId = 1;
      const subscription = {
        status: SubscriptionStatus.EXPIRED,
        plan: { maxMembers: 10 },
      };
      mockPrismaService.bandSubscriptions.findUnique.mockResolvedValue(subscription);

      const result = await service.checkPlanLimits(bandId, 'maxMembers');

      expect(result).toBe(false);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription', async () => {
      const bandId = 1;
      mockPrismaService.bandSubscriptions.findUnique.mockResolvedValue({ id: 1, bandId });
      mockPrismaService.bandSubscriptions.update.mockResolvedValue({
        id: 1,
        bandId,
        status: SubscriptionStatus.CANCELLED,
      });

      const result = await service.cancelSubscription(bandId);

      expect(result).toBeDefined();
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      expect(mockPrismaService.bandSubscriptions.update).toHaveBeenCalledWith({
        where: { bandId },
        data: { status: SubscriptionStatus.CANCELLED },
      });
    });

    it('should throw NotFoundException if subscription not found', async () => {
      mockPrismaService.bandSubscriptions.findUnique.mockResolvedValue(null);

      await expect(service.cancelSubscription(1)).rejects.toThrow(NotFoundException);
    });
  });
});
