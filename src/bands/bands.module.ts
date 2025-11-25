import { Module, forwardRef } from '@nestjs/common';
import { BandsController } from './bands.controller';

import { PrismaService } from '../prisma.service';
import { MembershipsService } from '../memberships/memberships.service';
import { BandsService } from './bands.service';
import { EventsModule } from '../events/events.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [forwardRef(() => EventsModule), SubscriptionsModule],
  controllers: [BandsController],
  providers: [BandsService, PrismaService, MembershipsService],
})
export class BandsModule { }
