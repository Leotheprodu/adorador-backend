import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from 'src/email/email.service';
import { MembershipsService } from 'src/memberships/memberships.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, EmailService, MembershipsService],
})
export class UsersModule {}
