import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaService } from 'src/prisma.service';
import { MembershipsService } from 'src/memberships/memberships.service';
import { EventsGateway } from './events.gateway';
import { EventsGatewayController } from './events-ws.controller';

@Module({
  controllers: [EventsController, EventsGatewayController],
  providers: [EventsService, PrismaService, MembershipsService, EventsGateway],
  exports: [EventsService],
})
export class EventsModule {}
