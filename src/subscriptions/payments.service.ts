import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentMethod, PaymentStatus, SubscriptionStatus, NotificationType } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly subscriptionsService: SubscriptionsService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async createPayment(bandId: number, planId: number, method: PaymentMethod, userId: number, proofUrl?: string) {
        // Verificar que el plan existe
        const plan = await this.prisma.subscriptionPlans.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            throw new NotFoundException('Plan not found');
        }

        // Obtener la suscripción de la banda (debe existir si la banda existe)
        let subscription = await this.prisma.bandSubscriptions.findUnique({
            where: { bandId },
        });

        if (!subscription) {
            // Fallback: crear suscripción si no existe (aunque debería)
            subscription = await this.prisma.bandSubscriptions.create({
                data: {
                    bandId,
                    planId, // Asignar el plan que intentan pagar temporalmente o mantener el actual?
                    // Mejor mantener el actual o TRIAL hasta que se apruebe.
                    // Pero para crear el registro necesitamos un planId valido.
                    // Usaremos el planId del intento de pago si no existe suscripción.
                    status: SubscriptionStatus.TRIAL,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(),
                }
            });
        }

        // Crear registro de pago
        const payment = await this.prisma.paymentHistory.create({
            data: {
                subscriptionId: subscription.id,
                planId: planId, // Guardar el plan por el que se pagó
                bandId: bandId,
                amount: plan.price,
                currency: plan.currency,
                method: method,
                status: PaymentStatus.PENDING,
                proofImageUrl: proofUrl,
                paidByUserId: userId,
                // Notes could be added here if DTO supported it
            },
        });

        return payment;
    }

    async approvePayment(paymentId: number, adminUserId: number) {
        const payment = await this.prisma.paymentHistory.findUnique({
            where: { id: paymentId },
            include: {
                subscription: true
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.status !== PaymentStatus.PENDING) {
            throw new BadRequestException('Payment is not pending');
        }

        // Obtener el plan del pago
        // Si el payment tiene planId, usarlo; si no, usar el de la suscripción (registros antiguos)
        const planId = payment.planId || payment.subscription.planId;
        const plan = await this.prisma.subscriptionPlans.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            throw new BadRequestException('Plan not found for this payment');
        }

        // Actualizar estado del pago
        await this.prisma.paymentHistory.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.APPROVED,
                approvedByUserId: adminUserId,
                approvedAt: new Date(),
            },
        });

        // Calcular nuevas fechas
        const startDate = new Date();
        const endDate = new Date();
        if (plan.durationDays) {
            endDate.setDate(startDate.getDate() + plan.durationDays);
        } else {
            // Mensual por defecto
            endDate.setMonth(startDate.getMonth() + 1);
        }

        // Actualizar suscripción
        await this.prisma.bandSubscriptions.update({
            where: { id: payment.subscriptionId },
            data: {
                planId: plan.id,
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: startDate,
                currentPeriodEnd: endDate,
            },
        });

        // Notificar al usuario
        if (payment.paidByUserId) {
            await this.notificationsService.createNotification(
                payment.paidByUserId,
                NotificationType.PAYMENT_APPROVED,
                'Pago Aprobado',
                `Tu pago de ${payment.amount} ${payment.currency} ha sido aprobado. Tu suscripción está activa.`,
                { paymentId: payment.id, planName: plan.name }
            );
        }

        return { message: 'Payment approved and subscription updated' };
    }

    async rejectPayment(paymentId: number, reason: string) {
        const payment = await this.prisma.paymentHistory.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.status !== PaymentStatus.PENDING) {
            throw new BadRequestException('Payment is not pending');
        }

        await this.prisma.paymentHistory.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.REJECTED,
                rejectionReason: reason,
                updatedAt: new Date(),
            },
        });

        // Notificar al usuario
        if (payment.paidByUserId) {
            await this.notificationsService.createNotification(
                payment.paidByUserId,
                NotificationType.PAYMENT_REJECTED,
                'Pago Rechazado',
                `Tu pago ha sido rechazado. Razón: ${reason}`,
                { paymentId: payment.id }
            );
        }

        return { message: 'Payment rejected' };
    }

    async getPendingPayments() {
        return await this.prisma.paymentHistory.findMany({
            where: { status: PaymentStatus.PENDING },
            include: {
                subscription: {
                    include: {
                        band: { select: { name: true } }
                    }
                },
                plan: { select: { id: true, name: true, price: true } },
                paidByUser: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getBandPayments(bandId: number) {
        return await this.prisma.paymentHistory.findMany({
            where: {
                bandId: bandId
            },
            include: {
                band: {
                    select: { id: true, name: true }
                },
                plan: {
                    select: { id: true, name: true, price: true }
                },
                // Incluir subscription.plan como fallback para registros antiguos
                subscription: {
                    select: {
                        plan: {
                            select: { id: true, name: true, price: true }
                        }
                    }
                },
                paidByUser: {
                    select: { id: true, name: true, phone: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
