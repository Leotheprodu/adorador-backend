import { Injectable } from '@nestjs/common';
import { CreateSongsChordDto } from './dto/create-songs-chord.dto';
import { UpdateSongsChordDto } from './dto/update-songs-chord.dto';

@Injectable()
export class SongsChordsService {
  create(createSongsChordDto: CreateSongsChordDto) {
    return 'This action adds a new songsChord';
  }

  findAll() {
    return `This action returns all songsChords`;
  }

  findOne(id: number) {
    return `This action returns a #${id} songsChord`;
  }

  update(id: number, updateSongsChordDto: UpdateSongsChordDto) {
    return `This action updates a #${id} songsChord`;
  }

  remove(id: number) {
    return `This action removes a #${id} songsChord`;
  }
}
