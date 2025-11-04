import { Module } from '@nestjs/common';
import { ChurchRolesService } from './church-roles.service';
import { ChurchRolesController } from './church-roles.controller';
import { PrismaService } from '../prisma.service';
import { MembershipsService } from '../memberships/memberships.service';

@Module({
  controllers: [ChurchRolesController],
  providers: [ChurchRolesService, PrismaService, MembershipsService],
})
export class ChurchRolesModule {}
