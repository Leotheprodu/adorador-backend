import { Module } from '@nestjs/common';
import { TemporalTokenPoolService } from './temporal-token-pool.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [TemporalTokenPoolService, PrismaService],
})
export class TemporalTokenPoolModule {}
