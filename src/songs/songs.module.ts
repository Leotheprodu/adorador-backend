import { forwardRef, Module } from '@nestjs/common';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { MembershipsService } from '../memberships/memberships.service';
import { PrismaService } from '../prisma.service';
import { EventsModule } from '../events/events.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [forwardRef(() => EventsModule), SubscriptionsModule],
  controllers: [SongsController],
  providers: [SongsService, MembershipsService, PrismaService],
})
export class SongsModule {}
