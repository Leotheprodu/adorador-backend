import { PartialType } from '@nestjs/swagger';
import { CreateSongsLyricDto } from './create-songs-lyric.dto';

export class UpdateSongsLyricDto extends PartialType(CreateSongsLyricDto) {}
