import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { SessionData } from 'express-session';
import {
  ApiLogin,
  ApiLogout,
  ApiVerify,
} from './decorators/swagger.decorators';
import { EmailService } from 'src/email/email.service';
import { userRoles } from 'config/constants';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { PermissionsGuard } from './guards/permissions/permissions.guard';
import { CheckLoginStatus } from './decorators/permissions.decorators';
import { TemporalTokenPoolService } from 'src/temporal-token-pool/temporal-token-pool.service';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { NewPaswordDTO } from './dto/new-password.dto';

@Controller('auth')
@ApiTags('auth')
@UseGuards(PermissionsGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private emailService: EmailService,
    private temporalTokenPoolService: TemporalTokenPoolService,
  ) {}

  @ApiLogin()
  @Post('/login')
  @CheckLoginStatus('notLoggedIn')
  async login(
    @Res() res: Response,
    @Body() body: LoginDto,
    @Session() session: SessionData,
  ) {
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
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      session.userId = user.id;
      session.name = user.name;
      session.isLoggedIn = true;
      session.roles = userRoles;
      session.memberships = userMemberships;
      session.membersofBands = membersofBands;
      res.status(HttpStatus.ACCEPTED).send({
        ...userData,
        roles: userRoles,
        isLoggedIn: true,
        memberships: userMemberships,
        membersofBands: membersofBands,
      });
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get('/check-login-status')
  @CheckLoginStatus('loggedIn')
  async checkLoginStatus(
    @Res() res: Response,
    @Session() session: SessionData,
  ) {
    try {
      res.status(HttpStatus.OK).send({
        id: session.userId,
        isLoggedIn: session.isLoggedIn,
      });
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiLogout()
  @Get('/logout')
  @CheckLoginStatus('loggedIn')
  async logout(@Res() res: Response, @Session() session: SessionData) {
    try {
      session.isLoggedIn = false;
      res.status(HttpStatus.OK).send({ id: session.userId, isLoggedIn: false });
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiVerify()
  @Get('/verify-email/:token')
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

  @Post('/forgot-password')
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
  @Post('/new-password')
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
