import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from 'src/email/email.service';
import { MembershipsService } from 'src/memberships/memberships.service';
import { TemporalTokenPoolService } from 'src/temporal-token-pool/temporal-token-pool.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    EmailService,
    MembershipsService,
    TemporalTokenPoolService,
  ],
})
export class UsersModule {}
