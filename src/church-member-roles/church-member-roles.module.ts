import { Module } from '@nestjs/common';
import { ChurchMemberRolesService } from './church-member-roles.service';
import { ChurchMemberRolesController } from './church-member-roles.controller';
import { PrismaService } from 'src/prisma.service';
import { MembershipsService } from 'src/memberships/memberships.service';

@Module({
  controllers: [ChurchMemberRolesController],
  providers: [ChurchMemberRolesService, MembershipsService, PrismaService],
})
export class ChurchMemberRolesModule {}
