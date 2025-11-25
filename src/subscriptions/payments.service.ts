import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentMethod, PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly subscriptionsService: SubscriptionsService,
    ) { }

    async createPayment(bandId: number, planId: number, method: PaymentMethod, proofUrl?: string) {
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
                amount: plan.price,
                currency: plan.currency,
                method: method,
                status: PaymentStatus.PENDING,
                proofImageUrl: proofUrl,
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

        // Obtener el plan asociado al pago (necesitamos saber qué plan pagaron)
        // El modelo PaymentHistory NO tiene planId directo.
        // Esto es un problema de diseño en el schema actual si queremos permitir cambiar de plan con un pago.
        // Asumiremos que el pago es para el plan que tiene la suscripción O necesitamos guardar el planId en el pago.
        // REVISIÓN: El schema PaymentHistory NO tiene planId.
        // SOLUCIÓN TEMPORAL: Usar el planId de la suscripción actual, O asumir que el usuario actualizó su suscripción a "PAYMENT_PENDING" con el nuevo plan antes de pagar.
        // Vamos a asumir que el frontend actualiza la suscripción al nuevo plan (status PAYMENT_PENDING) antes de crear el pago, O pasamos el planId en metadata (pero no hay metadata).

        // Vamos a buscar el plan basado en el monto del pago para intentar deducirlo, o confiar en la suscripción.
        // Lo más seguro es actualizar la suscripción con el plan correcto AL MOMENTO DE APROBAR.
        // Pero, ¿cuál es el plan correcto?
        // El schema tiene `amount`. Podemos buscar el plan por precio.
        const plan = await this.prisma.subscriptionPlans.findFirst({
            where: {
                price: payment.amount,
                currency: payment.currency
            }
        });

        if (!plan) {
            throw new BadRequestException('Could not determine plan from payment amount');
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

        return { message: 'Payment rejected' };
    }

    async getPendingPayments() {
        return await this.prisma.paymentHistory.findMany({
            where: { status: PaymentStatus.PENDING },
            include: {
                subscription: {
                    include: {
                        band: { select: { name: true } },
                        plan: { select: { name: true } }
                    }
                },
                paidByUser: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getBandPayments(bandId: number) {
        return await this.prisma.paymentHistory.findMany({
            where: {
                subscription: {
                    bandId: bandId
                }
            },
            include: {
                subscription: {
                    select: {
                        plan: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
