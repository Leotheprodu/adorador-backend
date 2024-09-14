import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateChurchDto } from './dto/create-church.dto';

@Injectable()
export class ChurchesService {
  constructor(private prisma: PrismaService) {}

  async getChurches() {
    return await this.prisma.churches.findMany();
  }

  async createChurch(data: CreateChurchDto) {
    const churche = await this.prisma.churches.create({ data });
    if (churche) {
      return churche;
    }
  }
  async getChurch(id: number) {
    return await this.prisma.churches.findUnique({
      where: { id },
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
