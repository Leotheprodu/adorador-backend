import { Module } from '@nestjs/common';
import { SongsLyricsService } from './songs-lyrics.service';
import { SongsLyricsController } from './songs-lyrics.controller';
import { MembershipsService } from '../memberships/memberships.service';
import { PrismaService } from '../prisma.service';
import { SongsService } from '../songs/songs.service';

@Module({
  controllers: [SongsLyricsController],
  providers: [
    SongsLyricsService,
    MembershipsService,
    PrismaService,
    SongsService,
  ],
})
export class SongsLyricsModule {}
