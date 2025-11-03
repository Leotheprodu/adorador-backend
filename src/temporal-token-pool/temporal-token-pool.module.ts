import { Module } from '@nestjs/common';
import { TemporalTokenPoolService } from './temporal-token-pool.service';
import { TemporalTokenPoolController } from './temporal-token-pool.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [TemporalTokenPoolController],
  providers: [TemporalTokenPoolService, PrismaService],
  exports: [TemporalTokenPoolService],
})
export class TemporalTokenPoolModule {}
