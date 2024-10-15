import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SongDetailDto {
  @IsNotEmpty()
  @IsNumber()
  songId: number;

  @IsNotEmpty()
  @IsNumber()
  order: number;

  @IsNotEmpty()
  @IsNumber()
  transpose: number;
}

export class AddSongsToEventDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SongDetailDto)
  songDetails: SongDetailDto[];
}

export class RemoveSongsToEventDto {
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  songIds: number[];
}
