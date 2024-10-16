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

@Controller('auth')
@ApiTags('auth')
@UseGuards(PermissionsGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private emailService: EmailService,
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
      const { password, roles, memberships, ...userData } = user;
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
      session.isLoggedIn = true;
      session.roles = userRoles;
      session.memberships = userMemberships;
      res.status(HttpStatus.ACCEPTED).send({
        ...userData,
        roles: userRoles,
        isLoggedIn: true,
        memberships: userMemberships,
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
      const verifyData = await this.authService.verifyEmail(token);
      if (verifyData.status !== 'active')
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      await this.usersService.addRole(verifyData.id, userRoles.user.id);
      await this.emailService.subscribeToNewsLetter(verifyData.email);
      res.status(HttpStatus.OK).send({ status: 'active' });
    } catch (e) {
      catchHandle(e);
    }
  }
}
