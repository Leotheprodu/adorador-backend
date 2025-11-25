import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlanType, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Crea una suscripción Trial para una banda.
     * @param bandId ID de la banda
     * @param isExistingBand Si es true, otorga 30 días de trial (migración). Si es false, 15 días (nueva banda).
     */
    async createTrialSubscription(bandId: number, isExistingBand = false) {
        // 1. Obtener el plan Trial
        const trialPlan = await this.prisma.subscriptionPlans.findUnique({
            where: { type: PlanType.TRIAL },
        });

        if (!trialPlan) {
            throw new NotFoundException('El plan Trial no está configurado en el sistema.');
        }

        // 2. Calcular fechas
        const startDate = new Date();
        const durationDays = isExistingBand ? 30 : (trialPlan.durationDays || 15);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + durationDays);

        // 3. Crear la suscripción
        return await this.prisma.bandSubscriptions.create({
            data: {
                bandId,
                planId: trialPlan.id,
                status: SubscriptionStatus.TRIAL,
                trialStartDate: startDate,
                trialEndDate: endDate,
                currentPeriodStart: startDate,
                currentPeriodEnd: endDate,
            },
        });
    }

    /**
     * Obtiene la suscripción activa de una banda.
     * @param bandId ID de la banda
     */
    async getSubscriptionByBandId(bandId: number) {
        const subscription = await this.prisma.bandSubscriptions.findUnique({
            where: { bandId },
            include: {
                plan: true,
            },
        });

        if (!subscription) {
            return null;
        }

        // Verificar si ha expirado
        if (subscription.currentPeriodEnd < new Date() && subscription.status === SubscriptionStatus.ACTIVE) {
            // Marcar como expirada si pasó la fecha
            // (Idealmente esto lo hace un cron job, pero lo verificamos aquí también)
            return { ...subscription, status: SubscriptionStatus.EXPIRED };
        }

        return subscription;
    }

    /**
     * Verifica si una banda puede realizar una acción según los límites de su plan.
     * @param bandId ID de la banda
     * @param resource Tipo de recurso ('maxMembers' | 'maxSongs' | 'maxEventsPerMonth')
     */
    async checkPlanLimits(bandId: number, resource: 'maxMembers' | 'maxSongs' | 'maxEventsPerMonth'): Promise<boolean> {
        const subscription = await this.getSubscriptionByBandId(bandId);

        // Si no tiene suscripción o está expirada/cancelada
        if (!subscription ||
            (subscription.status !== SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.TRIAL && subscription.status !== SubscriptionStatus.GRACE_PERIOD)) {
            return false;
        }

        const plan = subscription.plan;

        if (resource === 'maxMembers') {
            const count = await this.prisma.membersofBands.count({ where: { bandId } });
            return count < plan.maxMembers;
        }

        if (resource === 'maxSongs') {
            const count = await this.prisma.songs.count({ where: { bandId } });
            return count < plan.maxSongs;
        }

        if (resource === 'maxEventsPerMonth') {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const count = await this.prisma.events.count({
                where: {
                    bandId,
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
            });
            return count < plan.maxEventsPerMonth;
        }

        return false;
    }

    async cancelSubscription(bandId: number) {
        const subscription = await this.prisma.bandSubscriptions.findUnique({
            where: { bandId },
        });

        if (!subscription) {
            throw new NotFoundException('Suscripción no encontrada');
        }

        return await this.prisma.bandSubscriptions.update({
            where: { bandId },
            data: {
                status: SubscriptionStatus.CANCELLED,
            },
        });
    }
}
