import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import {
  ApiLogin,
  ApiLogout,
  ApiVerifyEmail,
  ApiCheckLoginStatus,
  ApiRefreshToken,
  ApiForgotPassword,
  ApiNewPassword,
} from './auth.swagger';
import { EmailService } from '../email/email.service';
import { userRoles } from '../../config/constants';
import { catchHandle } from '../chore/utils/catchHandle';
import { PermissionsGuard } from './guards/permissions/permissions.guard';
import { CheckLoginStatus } from './decorators/permissions.decorators';
import { TemporalTokenPoolService } from '../temporal-token-pool/temporal-token-pool.service';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { NewPaswordDTO } from './dto/new-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthJwtService } from './services/jwt.service';
import { PrismaService } from '../prisma.service';

@Controller('auth')
@ApiTags('auth')
@UseGuards(PermissionsGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private emailService: EmailService,
    private temporalTokenPoolService: TemporalTokenPoolService,
    private authJwtService: AuthJwtService,
    private prisma: PrismaService,
  ) {}

  @ApiLogin()
  @Post('/login')
  @CheckLoginStatus('notLoggedIn')
  async login(@Res() res: Response, @Body() body: LoginDto) {
    try {
      const user = await this.authService.login(body);
      const { password, roles, memberships, membersofBands, ...userData } =
        user;
      const userRoles = roles.map((role) => role.id);

      const userMemberships = memberships.map((membership) => {
        return {
          id: membership.id,
          church: { id: membership.church.id, name: membership.church.name },
          roles: membership.roles.map((role) => {
            return {
              id: role.id,
              name: role.role.name,
              churchRoleId: role.role.id,
            };
          }),
          since: membership.memberSince,
        };
      });

      const userBandMemberships = membersofBands.map((bandMember) => {
        return {
          id: bandMember.id,
          role: bandMember.role,
          isAdmin: bandMember.isAdmin,
          isEventManager: bandMember.isEventManager,
          band: {
            id: bandMember.band.id,
            name: bandMember.band.name,
          },
        };
      });

      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      // Generar tokens JWT
      const tokens = this.authJwtService.generateTokens(
        user.id,
        user.email,
        user.name,
        userRoles,
        userMemberships,
        userBandMemberships,
      );

      // Guardar refresh token en base de datos
      await this.prisma.users.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      res.status(HttpStatus.ACCEPTED).send({
        ...userData,
        roles: userRoles,
        isLoggedIn: true,
        memberships: userMemberships,
        membersofBands: userBandMemberships,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiCheckLoginStatus()
  @Get('/check-login-status')
  @CheckLoginStatus('loggedIn')
  async checkLoginStatus(@Res() res: Response, @Req() req: Request) {
    try {
      const user = req.user; // Viene del JwtAuthGuard
      res.status(HttpStatus.OK).send({
        id: user.sub,
        isLoggedIn: true,
        name: user.name,
        email: user.email,
        roles: user.roles,
        memberships: user.memberships,
        membersofBands: user.membersofBands,
      });
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiLogout()
  @Get('/logout')
  @CheckLoginStatus('loggedIn')
  async logout(@Res() res: Response, @Req() req: Request) {
    try {
      const user = req.user; // Viene del JwtAuthGuard

      // Limpiar refresh token de la base de datos
      await this.prisma.users.update({
        where: { id: user.sub },
        data: { refreshToken: null },
      });

      res.status(HttpStatus.OK).send({
        id: user.sub,
        isLoggedIn: false,
        message: 'Logged out successfully',
      });
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiRefreshToken()
  @Post('/refresh')
  @CheckLoginStatus('public')
  async refreshToken(@Res() res: Response, @Body() body: RefreshTokenDto) {
    try {
      const payload = this.authJwtService.verifyRefreshToken(body.refreshToken);
      const user = await this.prisma.users.findUnique({
        where: { id: payload.sub, refreshToken: body.refreshToken },
        include: {
          roles: true,
          memberships: {
            include: {
              church: true,
              roles: {
                include: {
                  role: true,
                },
              },
            },
          },
          membersofBands: {
            include: {
              band: true,
            },
          },
        },
      });

      if (!user) {
        throw new HttpException(
          'Invalid refresh token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const userRoles = user.roles.map((role) => role.id);
      const userMemberships = user.memberships.map((membership) => {
        return {
          id: membership.id,
          church: { id: membership.church.id, name: membership.church.name },
          roles: membership.roles.map((role) => {
            return {
              id: role.id,
              name: role.role.name,
              churchRoleId: role.role.id,
            };
          }),
          since: membership.memberSince,
        };
      });

      const userBandMemberships = user.membersofBands.map((bandMember) => {
        return {
          id: bandMember.id,
          role: bandMember.role,
          isAdmin: bandMember.isAdmin,
          isEventManager: bandMember.isEventManager,
          band: {
            id: bandMember.band.id,
            name: bandMember.band.name,
          },
        };
      });

      const newTokens = this.authJwtService.generateTokens(
        user.id,
        user.email,
        user.name,
        userRoles,
        userMemberships,
        userBandMemberships,
      );

      // Actualizar refresh token en BD
      await this.prisma.users.update({
        where: { id: user.id },
        data: { refreshToken: newTokens.refreshToken },
      });

      res.status(HttpStatus.OK).send({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      });
    } catch (error) {
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  @ApiVerifyEmail()
  @Get('/verify-email/:token')
  @CheckLoginStatus('public')
  async verifyEmail(@Res() res: Response, @Param('token') token: string) {
    try {
      const temporalTokenData =
        await this.temporalTokenPoolService.findToken(token);
      if (!temporalTokenData) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }
      const user = await this.usersService.activateUserByPhone(
        temporalTokenData.userPhone,
      );
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const deletedToken =
        await this.temporalTokenPoolService.deleteToken(token);
      if (!deletedToken) {
        throw new HttpException(
          'Error deleting token',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.usersService.addRole(user.id, userRoles.user.id);
      // Solo suscribir a newsletter si el usuario tiene email
      if (user.email) {
        try {
          await this.emailService.subscribeToNewsLetter(user.email);
        } catch (error) {
          console.log('Error subscribing to newsletter:', error);
          // No fallar la verificación por error de newsletter
        }
      }
      res.status(HttpStatus.OK).send({ status: 'active' });
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiForgotPassword()
  @Post('/forgot-password')
  @CheckLoginStatus('notLoggedIn')
  async forgotPassword(@Res() res: Response, @Body() body: ForgotPasswordDTO) {
    try {
      const user = await this.usersService.findByPhone(body.phone);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Generar token para reset de contraseña vía WhatsApp
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      await this.temporalTokenPoolService.createToken(
        resetToken,
        user.phone,
        'forgot_password',
      );

      res.status(HttpStatus.ACCEPTED).send({
        status: 'success',
        resetToken,
        phone: user.phone,
        whatsappMessage: `Para restablecer tu contraseña en Zamr, envía este mensaje al bot de WhatsApp ${process.env.WHATSAPP_BOT_NUMBER || '+50663017707'}: "resetpass-adorador:${resetToken}"`,
        message:
          'Token de restablecimiento generado. Envía el mensaje por WhatsApp para continuar.',
      });
    } catch (e) {
      // Personalizar mensajes de error para usuarios
      if (e.response?.includes('Ya se envió un correo')) {
        res.status(HttpStatus.TOO_MANY_REQUESTS).send({
          status: 'error',
          message: e.response,
        });
        return;
      } else if (
        e.message?.includes('Servidor de correo') ||
        e.message?.includes('temporalmente no disponible')
      ) {
        res.status(HttpStatus.SERVICE_UNAVAILABLE).send({
          status: 'error',
          message:
            'El servicio de correo está temporalmente no disponible. Por favor intenta de nuevo en unos minutos.',
        });
        return;
      }

      catchHandle(e);
    }
  }

  @Get('/email-service-status')
  @CheckLoginStatus('public')
  async checkEmailServiceStatus(@Res() res: Response) {
    try {
      // Test básico de conectividad SMTP
      const testResult = await this.emailService.testEmailService();
      const tokenStats = this.temporalTokenPoolService.getPoolStats();

      res.status(HttpStatus.OK).send({
        status: 'success',
        emailService: testResult ? 'available' : 'unavailable',
        tokenPool: tokenStats,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).send({
        status: 'error',
        emailService: 'unavailable',
        error: e.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('/admin/test-smtp')
  @CheckLoginStatus('public')
  async testSmtpConnection(@Res() res: Response) {
    try {
      const config = {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        username: process.env.EMAIL_USERNAME,
        secure: process.env.EMAIL_SECURE,
      };

      // Test de conectividad SMTP real
      const testResult = await this.emailService.testEmailService();

      res.status(HttpStatus.OK).send({
        status: 'success',
        config: config, // Para debugging (no incluye password)
        connectivity: testResult
          ? 'SMTP connection OK'
          : 'SMTP connection failed',
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).send({
        status: 'error',
        config: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          username: process.env.EMAIL_USERNAME,
          secure: process.env.EMAIL_SECURE,
        },
        error: e.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('/admin/test-email')
  @CheckLoginStatus('public')
  async testEmailSend(@Res() res: Response, @Body() body: { email: string }) {
    try {
      console.log(`[TEST] Testing email send to: ${body.email}`);

      // Test simple sin template
      await this.emailService['mailService'].sendMail({
        to: body.email,
        from: `"Zamr Test" <${process.env.EMAIL_USERNAME}>`,
        subject: 'Test Email - Zamr Simple',
        html: '<h1>Test Email</h1><p>Este es un email de prueba desde Zamr.</p>',
      });

      res.status(HttpStatus.OK).send({
        status: 'success',
        message: `Email de prueba enviado exitosamente a ${body.email}`,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[TEST] Error sending test email:', e);
      res.status(HttpStatus.SERVICE_UNAVAILABLE).send({
        status: 'error',
        message: `Failed to send test email: ${e.message}`,
        error: e.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('/admin/clear-reset-tokens')
  async clearResetTokens(
    @Res() res: Response,
    @Body() body: { email?: string },
  ) {
    try {
      if (body.email) {
        // Limpiar tokens de un email específico
        await this.temporalTokenPoolService.removeTokenFromGlobalPool(
          body.email,
          'forgot_password',
        );
        res.status(HttpStatus.OK).send({
          status: 'success',
          message: `Tokens de recuperación limpiados para ${body.email}`,
        });
      } else {
        // Limpiar todos los tokens expirados
        this.temporalTokenPoolService.cleanExpiredGlobalTokens();
        res.status(HttpStatus.OK).send({
          status: 'success',
          message: 'Todos los tokens expirados han sido limpiados',
        });
      }
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiNewPassword()
  @Post('/new-password')
  @CheckLoginStatus('notLoggedIn')
  async newPassword(@Res() res: Response, @Body() body: NewPaswordDTO) {
    try {
      const tempTokenInfo = await this.temporalTokenPoolService.findToken(
        body.token,
      );
      if (!tempTokenInfo) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }
      await this.usersService.updatePassword(
        tempTokenInfo.userPhone,
        body.password,
      );
      if (!tempTokenInfo) {
        throw new HttpException(
          'Error updating password',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else {
        await this.temporalTokenPoolService.deleteToken(body.token);
      }
      res.status(HttpStatus.ACCEPTED).send({ status: 'success' });
    } catch (e) {
      catchHandle(e);
    }
  }
}
