import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaService } from 'src/prisma.service';
import { MembershipsService } from 'src/memberships/memberships.service';
import { EventsGateway } from './events.gateway';

@Module({
  controllers: [EventsController],
  providers: [EventsService, PrismaService, MembershipsService, EventsGateway],
})
export class EventsModule {}
