import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';
import { MembershipsService } from 'src/memberships/memberships.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    UsersService,
    EmailService,
    MembershipsService,
  ],
})
export class AuthModule {}
