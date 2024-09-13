import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChurchesService {
  constructor(private prisma: PrismaService) {}

  async getChurches() {
    return await this.prisma.churches.findMany();
  }
}