import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NormalizeLyricsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @ApiProperty({
    description: 'Array of lyric IDs to normalize',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  lyricIds: number[];
}
