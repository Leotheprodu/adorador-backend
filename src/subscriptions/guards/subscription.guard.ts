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

        const request = context.switchToHttp().getRequest();
        const bandId = request.params.bandId || request.body.bandId;

        if (!bandId) {
            // Si no hay bandId, no podemos verificar (asumimos que la ruta no requiere verificación de banda específica o está mal configurada)
            // Ojo: Dependiendo de la seguridad, podríamos bloquear o permitir.
            // Para ser seguros, si la ruta tiene el decorador pero no bandId, bloqueamos.
            throw new ForbiddenException(
                'Subscription verification failed: No bandId provided in params or body',
            );
        }

        const canProceed = await this.subscriptionsService.checkPlanLimits(
            Number(bandId),
            resource,
        );

        if (!canProceed) {
            throw new ForbiddenException(
                `Plan limit reached for resource: ${resource}. Please upgrade your plan.`,
            );
        }

        return true;
    }
}
