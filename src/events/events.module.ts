import { forwardRef, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaService } from 'src/prisma.service';
import { MembershipsService } from 'src/memberships/memberships.service';
import { EventsGateway } from './events.gateway';
import { EventsGatewayController } from './events-ws.controller';

@Module({
  imports: [forwardRef(() => EventsModule)],
  controllers: [EventsController, EventsGatewayController],
  providers: [EventsService, EventsGateway, PrismaService, MembershipsService],
})
export class EventsModule {}
