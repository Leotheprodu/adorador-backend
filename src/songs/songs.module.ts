import { Module } from '@nestjs/common';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { MembershipsService } from 'src/memberships/memberships.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [SongsController],
  providers: [SongsService, MembershipsService, PrismaService],
})
export class SongsModule {}
