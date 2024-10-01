import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [MembershipsController],
  providers: [MembershipsService, PrismaService, UsersService],
})
export class MembershipsModule {}
