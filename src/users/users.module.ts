import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import { MembershipsService } from '../memberships/memberships.service';
import { TemporalTokenPoolService } from '../temporal-token-pool/temporal-token-pool.service';

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
