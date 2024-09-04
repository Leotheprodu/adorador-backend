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
import { IsLoggedInGuard } from './guards/is-logged-in/is-logged-in.guard';
import { UsersService } from 'src/users/users.service';
import { SessionData } from 'express-session';
import { IsNotLoggedInGuard } from './guards/is-not-logged-in/is-not-logged-in.guard';
import { ApiLogin, ApiLogout, ApiVerify } from './auth.swagger';
import { EmailService } from 'src/email/email.service';
import { userRoles } from 'config/constants';
import { catchHandle } from 'src/chore/utils/catchHandle';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  @ApiLogin()
  @Post('/login')
  @UseGuards(IsLoggedInGuard)
  async login(
    @Res() res: Response,
    @Body() body: LoginDto,
    @Session() session: SessionData,
  ) {
    try {
      const user = await this.authService.login(body);
      const { password, roles, churches, ...userData } = user;
      const userRoles = roles.map((role) => role.id);
      const userChurches = churches.map((church) => {
        return { id: church.id, name: church.name };
      });
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      session.userId = user.id;
      session.isLoggedIn = true;
      session.roles = userRoles;
      session.church = userChurches;
      res.status(HttpStatus.ACCEPTED).send({
        ...userData,
        roles: userRoles,
        isLoggedIn: true,
        church: userChurches,
      });
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiLogout()
  @Get('/logout')
  @UseGuards(IsNotLoggedInGuard)
  async logout(@Res() res: Response, @Session() session: SessionData) {
    try {
      const user = await this.usersService.getUser(session.userId);
      session.isLoggedIn = false;
      const { password, ...userData } = user;
      res.status(HttpStatus.OK).send({ ...userData, isLoggedIn: false });
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiVerify()
  @Get('/verify-email/:token')
  async verifyEmail(
    @Res() res: Response,
    @Session() session: SessionData,
    @Param('token') token: string,
  ) {
    try {
      const verifyData = await this.authService.verifyEmail(token);
      if (verifyData.status !== 'active')
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      await this.usersService.addRole(verifyData.id, userRoles.User.id);
      await this.emailService.subscribeToNewsLetter(verifyData.email);
      res.status(HttpStatus.OK).send({ status: 'active' });
    } catch (e) {
      catchHandle(e);
    }
  }
}
