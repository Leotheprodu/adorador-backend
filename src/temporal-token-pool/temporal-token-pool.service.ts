import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TemporalTokenPoolService {
  constructor(private prisma: PrismaService) {}

  async findToken(token: string) {
    return await this.prisma.temporal_token_pool.findUnique({
      where: { token },
    });
  }

  async deleteToken(token: string) {
    return await this.prisma.temporal_token_pool.delete({
      where: { token },
    });
  }
}
