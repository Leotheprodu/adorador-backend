import { forwardRef, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaService } from '../prisma.service';
import { MembershipsService } from '../memberships/memberships.service';
import { EventsGateway } from './events.gateway';
import { EventsGatewayController } from './events-ws.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => EventsModule), AuthModule],
  controllers: [EventsController, EventsGatewayController],
  providers: [EventsService, EventsGateway, PrismaService, MembershipsService],
  exports: [EventsGateway, EventsService],
})
export class EventsModule {}
