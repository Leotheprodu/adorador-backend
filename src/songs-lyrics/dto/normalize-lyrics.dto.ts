import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class NormalizeLyricsDto {
  @ApiProperty({
    description: 'Array of lyric IDs to normalize',
    example: [1, 2, 3, 4, 5],
    type: [Number],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one lyric ID must be provided' })
  @IsInt({ each: true, message: 'Each ID must be an integer' })
  lyricIds: number[];
}
