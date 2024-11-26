import { PartialType } from '@nestjs/swagger';
import { CreateSongsLyricDto } from './create-songs-lyric.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateSongsLyricDto extends PartialType(CreateSongsLyricDto) {
  @IsNumber()
  @IsOptional()
  id?: number;
}
