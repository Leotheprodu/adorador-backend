import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { LoginDto } from './dto/login.dto';
import { passwordCompare } from 'src/users/utils/handlePassword';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(body: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: {
        email: body.email,
      },
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
                    id: true,
                    name: true,
                  },
                },
              },
            },
            memberSince: true,
          },
        },
        roles: {
          select: {
            id: true,
          },
        },
      },
      omit: { createdAt: true, updatedAt: true },
    });
    if (!user) return null;
    const check = await passwordCompare(body.password, user.password);

    if (!check)
      throw new HttpException('Invalid Password', HttpStatus.UNAUTHORIZED);
    return user;
  }
}
