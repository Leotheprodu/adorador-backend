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

  async verifyEmail(token: string) {
    try {
      const tempToken = await this.prisma.temporal_token_pool.findUnique({
        where: { token },
      });
      if (!tempToken) {
        throw new Error('Invalid token');
      } else {
        const data = await this.prisma.users.update({
          where: { email: tempToken.userEmail },
          data: { status: 'active' },
        });
        await this.prisma.temporal_token_pool.delete({ where: { token } });
        return { status: 'active', email: tempToken.userEmail, id: data.id };
      }
    } catch (error) {
      throw new Error('Error verifying email');
    }
  }
}
