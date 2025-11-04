import { Module } from '@nestjs/common';
import { SongsLyricsService } from './songs-lyrics.service';
import { SongsLyricsController } from './songs-lyrics.controller';
import { MembershipsService } from '../memberships/memberships.service';
import { PrismaService } from '../prisma.service';
import { SongsService } from '../songs/songs.service';
import { LyricsNormalizerService } from './services/lyrics-normalizer.service';
import { ChordProcessorService } from './services/chord-processor.service';
import { LyricsParserService } from './services/lyrics-parser.service';

@Module({
  controllers: [SongsLyricsController],
  providers: [
    SongsLyricsService,
    MembershipsService,
    PrismaService,
    SongsService,
    LyricsNormalizerService,
    ChordProcessorService,
    LyricsParserService,
  ],
})
export class SongsLyricsModule {}
