import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus, SubscriptionStatus } from '@prisma/client';

const mockPrismaService = {
    subscriptionPlans: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
    },
    bandSubscriptions: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    paymentHistory: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
    },
};

const mockSubscriptionsService = {
    // Add methods if needed
};

describe('PaymentsService', () => {
    let service: PaymentsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: SubscriptionsService,
                    useValue: mockSubscriptionsService,
                },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createPayment', () => {
        it('should create a payment', async () => {
            const bandId = 1;
            const planId = 2;
            const plan = { id: planId, price: 10, currency: 'USD' };
            const subscription = { id: 1, bandId };

            mockPrismaService.subscriptionPlans.findUnique.mockResolvedValue(plan);
            mockPrismaService.bandSubscriptions.findUnique.mockResolvedValue(subscription);
            mockPrismaService.paymentHistory.create.mockResolvedValue({
                id: 1,
                subscriptionId: subscription.id,
                amount: plan.price,
                status: PaymentStatus.PENDING,
            });

            const result = await service.createPayment(bandId, planId, PaymentMethod.BANK_TRANSFER);

            expect(result).toBeDefined();
            expect(mockPrismaService.paymentHistory.create).toHaveBeenCalled();
        });

        it('should throw NotFoundException if plan not found', async () => {
            mockPrismaService.subscriptionPlans.findUnique.mockResolvedValue(null);

            await expect(service.createPayment(1, 99, PaymentMethod.BANK_TRANSFER)).rejects.toThrow(NotFoundException);
        });
    });

    describe('approvePayment', () => {
        it('should approve a payment and update subscription', async () => {
            const paymentId = 1;
            const adminUserId = 1;
            const payment = {
                id: paymentId,
                status: PaymentStatus.PENDING,
                subscriptionId: 1,
                amount: 10,
                currency: 'USD',
            };
            const plan = { id: 2, price: 10, currency: 'USD', durationDays: 30 };

            mockPrismaService.paymentHistory.findUnique.mockResolvedValue(payment);
            mockPrismaService.subscriptionPlans.findFirst.mockResolvedValue(plan);
            mockPrismaService.paymentHistory.update.mockResolvedValue({ ...payment, status: PaymentStatus.APPROVED });
            mockPrismaService.bandSubscriptions.update.mockResolvedValue({});

            const result = await service.approvePayment(paymentId, adminUserId);

            expect(result).toBeDefined();
            expect(mockPrismaService.paymentHistory.update).toHaveBeenCalledWith({
                where: { id: paymentId },
                data: expect.objectContaining({ status: PaymentStatus.APPROVED }),
            });
            expect(mockPrismaService.bandSubscriptions.update).toHaveBeenCalledWith({
                where: { id: payment.subscriptionId },
                data: expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
            });
        });
    });
});
