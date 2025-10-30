import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';
import { MembershipsService } from 'src/memberships/memberships.service';
import { TemporalTokenPoolService } from 'src/temporal-token-pool/temporal-token-pool.service';
import { AuthJwtService } from './services/jwt.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions/permissions.guard';
import { JwtPermissionsGuard } from './guards/jwt-permissions.guard';
import { JwtUserMiddleware } from './middlewares/jwt-user.middleware';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    UsersService,
    EmailService,
    MembershipsService,
    TemporalTokenPoolService,
    AuthJwtService,
    JwtAuthGuard,
    PermissionsGuard,
    JwtPermissionsGuard,
    JwtUserMiddleware,
  ],
  exports: [
    AuthJwtService,
    JwtAuthGuard,
    PermissionsGuard,
    JwtPermissionsGuard,
    JwtUserMiddleware,
  ],
})
export class AuthModule {}
