import { Module } from '@nestjs/common';
import { ChurchesController } from './churches.controller';
import { ChurchesService } from './churches.service';
import { PrismaService } from '../prisma.service';
import { MembershipsService } from '../memberships/memberships.service';

@Module({
  controllers: [ChurchesController],
  providers: [ChurchesService, PrismaService, MembershipsService],
})
export class ChurchesModule {}
