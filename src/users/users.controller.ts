import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Response } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { catchHandle } from '../chore/utils/catchHandle';
import {
  ApiGetUsers,
  ApiGetUser,
  ApiCreateUser,
  ApiDeleteUser,
  ApiUpdateUser,
  ApiAddUserRole,
  ApiRemoveUserRole,
} from './users.swagger';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AppRole,
  CheckLoginStatus,
  CheckUserId,
} from '../auth/decorators/permissions.decorators';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtPayload } from '../auth/services/jwt.service';
import { userRoles } from '../../config/constants';

@Controller('users')
@ApiTags('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  @ApiGetUsers()
  @Get()
  @CheckLoginStatus('loggedIn')
  async getUsers(@Res() res: Response) {
    try {
      const usersData = await this.usersService.getUsers();
      if (!usersData)
        throw new HttpException('Users not found', HttpStatus.NOT_FOUND);

      const users = usersData.map((user) => {
        return { ...user, roles: user.roles.map((role) => role.id) };
      });

      res.send(users);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetUser()
  @Get(':id')
  @CheckLoginStatus('loggedIn')
  @CheckUserId('id')
  async getUser(@Res() res: Response, @Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.usersService.getUser(id);
      const { password, ...rest } = user;
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      res.send(rest);
    } catch (e) {
      catchHandle(e);
    }
  }
  @ApiCreateUser()
  @Post()
  @CheckLoginStatus('public')
  async createUser(@Res() res: Response, @Body() body: CreateUserDto) {
    try {
      const result = await this.usersService.createUser(body);

      // El usuario se crea exitosamente con token de verificación para WhatsApp
      res.status(HttpStatus.CREATED).send({
        user: {
          id: result.id,
          name: result.name,
          phone: result.phone,
          email: result.email,
          status: result.status,
        },
        verificationToken: result.verificationToken,
        whatsappMessage: `Para verificar tu cuenta en Zamr, envía este mensaje al bot de WhatsApp ${process.env.WHATSAPP_BOT_NUMBER || '+50663017707'}: "registro-adorador:${result.verificationToken}"`,
        message: result.message,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === 'P2002') {
          throw new HttpException(
            'Número de teléfono ya existe',
            HttpStatus.CONFLICT,
          );
        }
      } else {
        catchHandle(e);
      }
    }
  }
  @ApiDeleteUser()
  @Delete(':id')
  @CheckLoginStatus('loggedIn')
  @AppRole(userRoles.admin.id)
  async deleteUser(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      await this.usersService.deleteUser(id);
      res.send({ message: `User id ${id} deleted` });
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiUpdateUser()
  @Post(':id')
  @CheckLoginStatus('loggedIn')
  @CheckUserId('id')
  async updateUser(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateUserDto,
  ) {
    try {
      const updatedUser = await this.usersService.updateUser(id, body);
      res.send(updatedUser);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiAddUserRole()
  @Get('/add-role/:id/:roleId')
  @CheckLoginStatus('loggedIn')
  @AppRole(userRoles.admin.id)
  async addRole(
    @Res() res: Response,
    @Param('id', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    try {
      const updatedUser = await this.usersService.addRole(userId, roleId);
      res.send(updatedUser);
    } catch (e) {
      catchHandle(e);
    }
  }
  @ApiRemoveUserRole()
  @Get('/delete-role/:id/:roleId')
  @CheckLoginStatus('loggedIn')
  @AppRole(userRoles.admin.id)
  async removeRole(
    @Res() res: Response,
    @Param('id', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    try {
      const updatedUser = await this.usersService.removeRole(userId, roleId);
      res.send(updatedUser);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post('/resend-verification')
  @CheckLoginStatus('public')
  async resendVerification(
    @Res() res: Response,
    @Body() body: { phone: string },
  ) {
    try {
      // Check if user exists and is not verified
      const user = await this.usersService.findByPhone(body.phone);
      if (!user) {
        throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
      }

      if (user.status === 'active') {
        throw new HttpException(
          'Número de WhatsApp ya está verificado',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Generar nuevo token de verificación para WhatsApp
      const verificationToken = require('crypto')
        .randomBytes(32)
        .toString('hex');
      await this.usersService['temporalTokenService'].createToken(
        verificationToken,
        user.phone,
        'verify_phone',
      );

      res.send({
        success: true,
        verificationToken,
        whatsappMessage: `Para verificar tu cuenta en Zamr, envía este mensaje al bot de WhatsApp ${process.env.WHATSAPP_BOT_NUMBER || '+50663017707'}: "registro-adorador:${verificationToken}"`,
        message: 'Token de verificación de WhatsApp generado exitosamente.',
      });
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
      catchHandle(e);
    }
  }
}
