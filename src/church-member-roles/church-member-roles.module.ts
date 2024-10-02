import { Module } from '@nestjs/common';
import { ChurchMemberRolesService } from './church-member-roles.service';
import { ChurchMemberRolesController } from './church-member-roles.controller';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [ChurchMemberRolesController],
  providers: [ChurchMemberRolesService, UsersService, PrismaService],
})
export class ChurchMemberRolesModule {}
