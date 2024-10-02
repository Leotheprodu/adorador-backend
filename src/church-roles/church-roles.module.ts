import { Module } from '@nestjs/common';
import { ChurchRolesService } from './church-roles.service';
import { ChurchRolesController } from './church-roles.controller';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [ChurchRolesController],
  providers: [ChurchRolesService, PrismaService, UsersService],
})
export class ChurchRolesModule {}
