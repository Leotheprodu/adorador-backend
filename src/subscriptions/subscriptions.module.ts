import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaService } from '../prisma.service';
import { SubscriptionGuard } from './guards/subscription.guard';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
    imports: [],
    controllers: [SubscriptionsController, PaymentsController],
    providers: [SubscriptionsService, PrismaService, SubscriptionGuard, PaymentsService],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule { }
