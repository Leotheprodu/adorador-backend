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
import { EmailService } from 'src/email/email.service';
import { catchHandle } from 'src/chore/utils/catchHandle';
import {
  ApiGetUsers,
  ApiGetUser,
  ApiCreateUser,
  ApiDeleteUser,
  ApiUpdateUser,
  ApiAddUserRole,
  ApiRemoveUserRole,
} from './users.swagger';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  AppRole,
  CheckLoginStatus,
  CheckUserId,
} from 'src/auth/decorators/permissions.decorators';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtPayload } from 'src/auth/services/jwt.service';
import { userRoles } from 'config/constants';

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
      const newUser = await this.usersService.createUser(body);

      // Try to send email verification, but don't fail the user creation if it fails
      if (newUser.id >= 1) {
        try {
          await this.emailService.sendEmailVerification(newUser.email);
          res.status(HttpStatus.CREATED).send({
            ...newUser,
            emailSent: true,
            message:
              'Usuario creado exitosamente. Revisa tu correo para verificar tu cuenta.',
          });
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          // User was created successfully, but email failed
          res.status(HttpStatus.CREATED).send({
            ...newUser,
            emailSent: false,
            message:
              'Usuario creado exitosamente, pero no se pudo enviar el correo de verificación. Puedes solicitar un nuevo correo de verificación más tarde.',
          });
        }
      } else {
        res.status(HttpStatus.CREATED).send(newUser);
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === 'P2002') {
          throw new HttpException('Email already exists', HttpStatus.CONFLICT);
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
    @Body() body: { email: string },
  ) {
    try {
      // Check if user exists and is not verified
      const user = await this.usersService.findByEmail(body.email);
      if (!user) {
        throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
      }

      if (user.status === 'active') {
        throw new HttpException(
          'Email ya está verificado',
          HttpStatus.BAD_REQUEST,
        );
      }

      try {
        await this.emailService.sendEmailVerification(user.email);
        res.send({
          success: true,
          message: 'Correo de verificación enviado exitosamente.',
        });
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError);
        throw new HttpException(
          'No se pudo enviar el correo de verificación. Intenta de nuevo en unos minutos.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
      catchHandle(e);
    }
  }
}
