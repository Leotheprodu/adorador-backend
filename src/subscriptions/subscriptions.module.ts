import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaService } from '../prisma.service';
import { SubscriptionGuard } from './guards/subscription.guard';
import { MembershipsService } from '../memberships/memberships.service';
import { NotificationsModule } from '../notifications/notifications.module';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SubscriptionsCronService } from './subscriptions.cron';

@Module({
    imports: [NotificationsModule],
    controllers: [SubscriptionsController, PaymentsController],
    providers: [
        SubscriptionsService,
        PrismaService,
        SubscriptionGuard,
        PaymentsService,
        SubscriptionsCronService,
        MembershipsService,
    ],
    exports: [SubscriptionsService, SubscriptionGuard],
})
export class SubscriptionsModule { }
