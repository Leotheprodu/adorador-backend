import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateBandDto } from './dto/create-band.dto';

@Injectable()
export class BandsService {
  constructor(private prisma: PrismaService) {}

  async getBands() {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return await this.prisma.bands.findMany({
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async getBandsByUserId(userId: number) {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return await this.prisma.bands.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
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
          },
        },
        _count: {
          select: {
            members: true,
            events: true,
            songs: true,
          },
        },
      },
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createBand(data: CreateBandDto) {
    const bande = await this.prisma.bands.create({ data });
    if (bande) {
      return bande;
    }
  }
  async getBand(id: number) {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return await this.prisma.bands.findUnique({
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
          },
        },
        events: {
          /* where: {
            date: {
              gt: currentDate,
            },
          }, */
          orderBy: {
            date: 'asc',
          },
          omit: {
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }
  async updateBand(id: number, data: CreateBandDto) {
    return await this.prisma.bands.update({
      where: { id },
      data,
    });
  }
  async deleteBand(id: number) {
    return await this.prisma.bands.delete({
      where: { id },
    });
  }
}
