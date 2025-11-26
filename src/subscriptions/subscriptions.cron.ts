import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsCronService {
    private readonly logger = new Logger(SubscriptionsCronService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Cron job que se ejecuta cada día a las 2:00 AM
     * Verifica suscripciones expiradas y aplica períodos de gracia
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async checkExpiredSubscriptions() {
        this.logger.log('Iniciando verificación de suscripciones expiradas...');

        const now = new Date();

        try {
            // 1. Buscar suscripciones TRIAL que hayan expirado
            const expiredTrials = await this.prisma.bandSubscriptions.findMany({
                where: {
                    status: SubscriptionStatus.TRIAL,
                    currentPeriodEnd: {
                        lt: now,
                    },
                },
                include: {
                    band: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            // Aplicar período de gracia de 3 días
            for (const subscription of expiredTrials) {
                const gracePeriodEnd = new Date(now);
                gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

                await this.prisma.bandSubscriptions.update({
                    where: { id: subscription.id },
                    data: {
                        status: SubscriptionStatus.GRACE_PERIOD,
                        gracePeriodEnd,
                    },
                });

                this.logger.log(
                    `Trial expirado para banda "${subscription.band.name}" (ID: ${subscription.bandId}). ` +
                    `Período de gracia aplicado hasta ${gracePeriodEnd.toISOString()}`,
                );
            }

            // 2. Buscar suscripciones ACTIVE que hayan expirado
            const expiredActive = await this.prisma.bandSubscriptions.findMany({
                where: {
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodEnd: {
                        lt: now,
                    },
                },
                include: {
                    band: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            // Aplicar período de gracia de 3 días
            for (const subscription of expiredActive) {
                const gracePeriodEnd = new Date(now);
                gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

                await this.prisma.bandSubscriptions.update({
                    where: { id: subscription.id },
                    data: {
                        status: SubscriptionStatus.GRACE_PERIOD,
                        gracePeriodEnd,
                    },
                });

                this.logger.log(
                    `Suscripción activa expirada para banda "${subscription.band.name}" (ID: ${subscription.bandId}). ` +
                    `Período de gracia aplicado hasta ${gracePeriodEnd.toISOString()}`,
                );
            }

            // 3. Buscar suscripciones en GRACE_PERIOD que hayan expirado
            const expiredGrace = await this.prisma.bandSubscriptions.findMany({
                where: {
                    status: SubscriptionStatus.GRACE_PERIOD,
                    gracePeriodEnd: {
                        lt: now,
                    },
                },
                include: {
                    band: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            // Marcar como EXPIRED
            for (const subscription of expiredGrace) {
                await this.prisma.bandSubscriptions.update({
                    where: { id: subscription.id },
                    data: {
                        status: SubscriptionStatus.EXPIRED,
                    },
                });

                this.logger.warn(
                    `Período de gracia expirado para banda "${subscription.band.name}" (ID: ${subscription.bandId}). ` +
                    `Suscripción marcada como EXPIRED. La banda no podrá crear nuevos recursos.`,
                );
            }

            this.logger.log(
                `Verificación completada. ` +
                `Trials expirados: ${expiredTrials.length}, ` +
                `Activas expiradas: ${expiredActive.length}, ` +
                `Períodos de gracia expirados: ${expiredGrace.length}`,
            );
        } catch (error) {
            this.logger.error(
                'Error al verificar suscripciones expiradas:',
                error.stack,
            );
        }
    }

    /**
     * Cron job que se ejecuta cada hora
     * Verifica suscripciones con pagos pendientes que hayan sido aprobados
     */
    @Cron(CronExpression.EVERY_HOUR)
    async checkPendingPayments() {
        this.logger.log('Verificando pagos pendientes...');

        try {
            const pendingSubscriptions = await this.prisma.bandSubscriptions.findMany(
                {
                    where: {
                        status: SubscriptionStatus.PAYMENT_PENDING,
                    },
                    include: {
                        payments: {
                            where: {
                                status: 'APPROVED',
                            },
                            orderBy: {
                                createdAt: 'desc',
                            },
                            take: 1,
                        },
                        band: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            );

            for (const subscription of pendingSubscriptions) {
                if (subscription.payments.length > 0) {
                    // Hay un pago aprobado, pero la suscripción no se actualizó
                    this.logger.warn(
                        `Suscripción con pago aprobado pero estado no actualizado para banda "${subscription.band.name}" (ID: ${subscription.bandId})`,
                    );
                }
            }

            this.logger.log('Verificación de pagos pendientes completada.');
        } catch (error) {
            this.logger.error('Error al verificar pagos pendientes:', error.stack);
        }
    }
}
