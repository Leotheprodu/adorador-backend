import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsCronService } from './subscriptions.cron';
import { PrismaService } from '../prisma.service';
import { SubscriptionStatus } from '@prisma/client';

const mockPrismaService = {
    bandSubscriptions: {
        findMany: jest.fn(),
        update: jest.fn(),
    },
};

describe('SubscriptionsCronService', () => {
    let service: SubscriptionsCronService;
    let prisma: typeof mockPrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionsCronService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<SubscriptionsCronService>(SubscriptionsCronService);
        prisma = mockPrismaService;

        // Reset mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('checkExpiredSubscriptions', () => {
        it('should apply grace period to expired trials', async () => {
            const now = new Date();
            const expiredDate = new Date(now);
            expiredDate.setDate(expiredDate.getDate() - 1);

            const expiredTrial = {
                id: 1,
                bandId: 1,
                status: SubscriptionStatus.TRIAL,
                currentPeriodEnd: expiredDate,
                band: { id: 1, name: 'Test Band' },
            };

            prisma.bandSubscriptions.findMany
                .mockResolvedValueOnce([expiredTrial]) // Expired trials
                .mockResolvedValueOnce([]) // Expired active
                .mockResolvedValueOnce([]); // Expired grace

            await service.checkExpiredSubscriptions();

            expect(prisma.bandSubscriptions.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    status: SubscriptionStatus.GRACE_PERIOD,
                    gracePeriodEnd: expect.any(Date),
                },
            });
        });

        it('should mark grace period as expired', async () => {
            const now = new Date();
            const expiredGraceDate = new Date(now);
            expiredGraceDate.setDate(expiredGraceDate.getDate() - 1);

            const expiredGrace = {
                id: 2,
                bandId: 2,
                status: SubscriptionStatus.GRACE_PERIOD,
                gracePeriodEnd: expiredGraceDate,
                band: { id: 2, name: 'Test Band 2' },
            };

            prisma.bandSubscriptions.findMany
                .mockResolvedValueOnce([]) // Expired trials
                .mockResolvedValueOnce([]) // Expired active
                .mockResolvedValueOnce([expiredGrace]); // Expired grace

            await service.checkExpiredSubscriptions();

            expect(prisma.bandSubscriptions.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: {
                    status: SubscriptionStatus.EXPIRED,
                },
            });
        });

        it('should handle errors gracefully', async () => {
            prisma.bandSubscriptions.findMany.mockRejectedValueOnce(
                new Error('Database error'),
            );

            // Should not throw
            await expect(service.checkExpiredSubscriptions()).resolves.not.toThrow();
        });
    });

    describe('checkPendingPayments', () => {
        it('should check pending payment subscriptions', async () => {
            const pendingSubscription = {
                id: 1,
                bandId: 1,
                status: SubscriptionStatus.PAYMENT_PENDING,
                payments: [{ status: 'APPROVED' }],
                band: { id: 1, name: 'Test Band' },
            };

            prisma.bandSubscriptions.findMany.mockResolvedValueOnce([
                pendingSubscription,
            ]);

            await service.checkPendingPayments();

            expect(prisma.bandSubscriptions.findMany).toHaveBeenCalledWith({
                where: {
                    status: SubscriptionStatus.PAYMENT_PENDING,
                },
                include: expect.any(Object),
            });
        });

        it('should handle errors gracefully', async () => {
            prisma.bandSubscriptions.findMany.mockRejectedValueOnce(
                new Error('Database error'),
            );

            // Should not throw
            await expect(service.checkPendingPayments()).resolves.not.toThrow();
        });
    });
});
