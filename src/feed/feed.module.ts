import { Module, forwardRef } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { FeedGateway } from './feed.gateway';
import { PrismaService } from '../prisma.service';
import { MembershipsService } from '../memberships/memberships.service';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [EventsModule, forwardRef(() => NotificationsModule)],
  controllers: [FeedController],
  providers: [FeedService, FeedGateway, PrismaService, MembershipsService],
  exports: [FeedService],
})
export class FeedModule {}
