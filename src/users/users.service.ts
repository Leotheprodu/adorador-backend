import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma.service';
import { passwordEncrypt } from './utils/handlePassword';
import { TemporalTokenPoolService } from '../temporal-token-pool/temporal-token-pool.service';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private temporalTokenService: TemporalTokenPoolService,
  ) {}

  async getUsers() {
    return await this.prisma.users.findMany({
      omit: {
        password: true,
      },
      include: {
        roles: {
          select: {
            id: true,
          },
        },
        memberships: {
          where: { active: true },
          select: {
            id: true,
            church: {
              select: {
                id: true,
                name: true,
              },
            },
            roles: {
              select: {
                id: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            memberSince: true,
          },
        },
        membersofBands: {
          where: { active: true },
          select: {
            id: true,
            role: true,
            isAdmin: true,
            isEventManager: true,
            active: true,
            band: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }
  async createUser(user: CreateUserDto) {
    const password = await passwordEncrypt(user.password);

    // Crear el usuario con status inactive por defecto
    const newUser = await this.prisma.users.create({
      data: {
        ...user,
        password,
        status: 'inactive', // Los usuarios empiezan inactivos hasta verificar WhatsApp
      },
      omit: {
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.temporalTokenService.createToken(
      verificationToken,
      user.phone,
      'verify_phone',
    );

    return {
      ...newUser,
      verificationToken,
      message: 'Usuario creado. Verificación de WhatsApp requerida.',
    };
  }

  async getUser(id: number) {
    return await this.prisma.users.findUnique({
      where: { id },
      include: {
        memberships: {
          where: { active: true },
          select: {
            id: true,
            church: {
              select: {
                id: true,
                name: true,
              },
            },
            roles: {
              select: {
                id: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            memberSince: true,
          },
        },
        roles: true,
        membersofBands: {
          where: { active: true },
          select: {
            id: true,
            role: true,
            isAdmin: true,
            isEventManager: true,
            active: true,
            band: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  deleteUser(id: number) {
    return this.prisma.users.delete({ where: { id } });
  }
  updateUser(id: number, user: CreateUserDto) {
    return this.prisma.users.update({ where: { id }, data: user });
  }
  addRole(userId: number, roleId: number) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: roleId },
        },
      },
    });
  }
  removeRole(userId: number, roleId: number) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { id: roleId },
        },
      },
    });
  }

  async activateUserByPhone(phone: string) {
    return await this.prisma.users.update({
      where: { phone },
      data: { status: 'active' },
    });
  }

  async findByPhone(phone: string) {
    return await this.prisma.users.findUnique({
      where: {
        phone,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        status: true,
      },
    });
  }

  async updatePassword(phone: string, password: string) {
    const newPassword = await passwordEncrypt(password);
    return await this.prisma.users.update({
      where: { phone },
      data: { password: newPassword },
    });
  }
}
