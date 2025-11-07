import { forwardRef, Module } from '@nestjs/common';
import { SongsChordsService } from './songs-chords.service';
import { SongsChordsController } from './songs-chords.controller';
import { MembershipsService } from '../memberships/memberships.service';
import { PrismaService } from '../prisma.service';
import { SongsService } from '../songs/songs.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [forwardRef(() => EventsModule)],
  controllers: [SongsChordsController],
  providers: [
    SongsChordsService,
    MembershipsService,
    PrismaService,
    SongsService,
  ],
})
export class SongsChordsModule {}
