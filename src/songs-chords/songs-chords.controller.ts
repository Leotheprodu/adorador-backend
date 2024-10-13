import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SongsChordsService } from './songs-chords.service';
import { CreateSongsChordDto } from './dto/create-songs-chord.dto';
import { UpdateSongsChordDto } from './dto/update-songs-chord.dto';

@Controller('songs-chords')
export class SongsChordsController {
  constructor(private readonly songsChordsService: SongsChordsService) {}

  @Post()
  create(@Body() createSongsChordDto: CreateSongsChordDto) {
    return this.songsChordsService.create(createSongsChordDto);
  }

  @Get()
  findAll() {
    return this.songsChordsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.songsChordsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSongsChordDto: UpdateSongsChordDto) {
    return this.songsChordsService.update(+id, updateSongsChordDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.songsChordsService.remove(+id);
  }
}
