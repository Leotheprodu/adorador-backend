import { Injectable } from '@nestjs/common';
import { CreateSongsChordDto } from './dto/create-songs-chord.dto';
import { UpdateSongsChordDto } from './dto/update-songs-chord.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SongsChordsService {
  constructor(private prima: PrismaService) {}
  create(createSongsChordDto: CreateSongsChordDto, lyricId: number) {
    return this.prima.songs_Chords.create({
      data: {
        ...createSongsChordDto,
        lyricId: lyricId,
      },
    });
  }

  findAll(lyricId: number) {
    return this.prima.songs_Chords.findMany({
      where: {
        lyricId,
      },
    });
  }

  findOne(id: number, lyricId: number) {
    return this.prima.songs_Chords.findUnique({
      where: {
        id,
        lyricId,
      },
    });
  }

  update(
    id: number,
    lyricId: number,
    updateSongsChordDto: UpdateSongsChordDto,
  ) {
    return this.prima.songs_Chords.update({
      where: {
        id,
        lyricId,
      },
      data: updateSongsChordDto,
    });
  }

  remove(id: number, lyricId: number) {
    return this.prima.songs_Chords.delete({
      where: {
        id,
        lyricId,
      },
    });
  }
}
