import { Module } from '@nestjs/common';
import { ChurchesController } from './churches.controller';
import { ChurchesService } from './churches.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [ChurchesController],
  providers: [ChurchesService, PrismaService],
})
export class ChurchesModule {}
