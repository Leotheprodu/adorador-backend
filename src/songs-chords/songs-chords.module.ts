import { Module } from '@nestjs/common';
import { SongsChordsService } from './songs-chords.service';
import { SongsChordsController } from './songs-chords.controller';
import { MembershipsService } from 'src/memberships/memberships.service';
import { PrismaService } from 'src/prisma.service';
import { SongsService } from 'src/songs/songs.service';

@Module({
  controllers: [SongsChordsController],
  providers: [
    SongsChordsService,
    MembershipsService,
    PrismaService,
    SongsService,
  ],
})
export class SongsChordsModule {}
