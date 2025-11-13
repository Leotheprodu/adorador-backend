import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [MembershipsController],
  providers: [MembershipsService, PrismaService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
