import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParseSingleLyricDto {
  @ApiProperty({
    description: 'Text content with chords and lyrics for a single line',
    example: '       Em      D\nMi Dios eres mi fortaleza',
  })
  @IsString()
  @IsNotEmpty()
  textContent: string;
}
