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
import { UsersService } from 'src/users/users.service';
import {
  ApiLogin,
  ApiLogout,
  ApiVerifyEmail,
  ApiCheckLoginStatus,
  ApiRefreshToken,
  ApiForgotPassword,
  ApiNewPassword,
} from './auth.swagger';
import { EmailService } from 'src/email/email.service';
import { userRoles } from 'config/constants';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { PermissionsGuard } from './guards/permissions/permissions.guard';
import { CheckLoginStatus } from './decorators/permissions.decorators';
import { TemporalTokenPoolService } from 'src/temporal-token-pool/temporal-token-pool.service';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { NewPaswordDTO } from './dto/new-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthJwtService } from './services/jwt.service';
import { PrismaService } from 'src/prisma.service';

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
      const user = await this.usersService.activateUserByEmail(
        temporalTokenData.userEmail,
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
      await this.emailService.subscribeToNewsLetter(user.email);
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
      const user = await this.usersService.findByEmail(body.email);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      await this.emailService.sendForgotPasswordEmail(user.email);
      res.status(HttpStatus.ACCEPTED).send({ status: 'success' });
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
        tempTokenInfo.userEmail,
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
