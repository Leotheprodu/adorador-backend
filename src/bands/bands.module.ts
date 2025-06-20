import { Module } from '@nestjs/common';
import { BandsController } from './bands.controller';

import { PrismaService } from 'src/prisma.service';
import { MembershipsService } from 'src/memberships/memberships.service';
import { BandsService } from './bands.service';

@Module({
  controllers: [BandsController],
  providers: [BandsService, PrismaService, MembershipsService],
})
export class BandsModule {}
