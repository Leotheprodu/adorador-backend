import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';

export const CHECK_SUBSCRIPTION_LIMIT_KEY = 'check_subscription_limit';
export const CheckSubscriptionLimit = (
    resource: 'maxMembers' | 'maxSongs' | 'maxEventsPerMonth',
) => SetMetadata(CHECK_SUBSCRIPTION_LIMIT_KEY, resource);

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private subscriptionsService: SubscriptionsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const resource = this.reflector.getAllAndOverride<
            'maxMembers' | 'maxSongs' | 'maxEventsPerMonth'
        >(CHECK_SUBSCRIPTION_LIMIT_KEY, [context.getHandler(), context.getClass()]);

        if (!resource) {
            return true;
        }

        console.log('🔒 [SubscriptionGuard] Verificando límite para recurso:', resource);

        const request = context.switchToHttp().getRequest();
        const bandId = request.params.bandId || request.body.bandId;

        if (!bandId) {
            console.error('❌ [SubscriptionGuard] No bandId encontrado');
            throw new ForbiddenException(
                'Subscription verification failed: No bandId provided in params or body',
            );
        }

        console.log('🔍 [SubscriptionGuard] Verificando bandId:', bandId, 'para recurso:', resource);

        const canProceed = await this.subscriptionsService.checkPlanLimits(
            Number(bandId),
            resource,
        );

        console.log('📊 [SubscriptionGuard] Resultado de verificación:', canProceed ? '✅ PERMITIDO' : '❌ BLOQUEADO');

        if (!canProceed) {
            // Mensajes personalizados según el recurso
            const messages = {
                maxMembers: 'Has alcanzado el límite de miembros de tu plan. Actualiza tu suscripción para agregar más.',
                maxSongs: 'Has alcanzado el límite de canciones de tu plan. Actualiza tu suscripción para agregar más.',
                maxEventsPerMonth: 'Has alcanzado el límite de eventos del mes según tu plan. Actualiza tu suscripción para crear más eventos.',
            };

            throw new ForbiddenException({
                message: messages[resource],
                resource,
                statusCode: 403,
            });
        }

        return true;
    }
}
