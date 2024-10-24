import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateChurchDto } from './dto/create-church.dto';

@Injectable()
export class ChurchesService {
  constructor(private prisma: PrismaService) {}

  async getChurches() {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return await this.prisma.churches.findMany({
      omit: {
        createdAt: true,
        updatedAt: true,
      },
      include: {
        events: {
          where: {
            date: {
              gt: currentDate,
            },
          },
          omit: {
            createdAt: true,
            updatedAt: true,
            churchId: true,
          },
        },
      },
    });
  }

  async createChurch(data: CreateChurchDto) {
    const churche = await this.prisma.churches.create({ data });
    if (churche) {
      return churche;
    }
  }
  async getChurch(id: number) {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return await this.prisma.churches.findUnique({
      where: { id },
      omit: {
        createdAt: true,
        updatedAt: true,
      },

      include: {
        _count: {
          select: {
            events: true,
            songs: true,
            memberships: true,
          },
        },
        events: {
          where: {
            date: {
              gt: currentDate,
            },
          },
          orderBy: {
            date: 'asc',
          },
          omit: {
            createdAt: true,
            updatedAt: true,
            churchId: true,
          },
        },
      },
    });
  }
  async updateChurch(id: number, data: CreateChurchDto) {
    return await this.prisma.churches.update({
      where: { id },
      data,
    });
  }
  async deleteChurch(id: number) {
    return await this.prisma.churches.delete({
      where: { id },
    });
  }
}
