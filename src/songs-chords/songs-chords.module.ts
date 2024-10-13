import { Module } from '@nestjs/common';
import { SongsChordsService } from './songs-chords.service';
import { SongsChordsController } from './songs-chords.controller';

@Module({
  controllers: [SongsChordsController],
  providers: [SongsChordsService],
})
export class SongsChordsModule {}
