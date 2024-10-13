import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

enum positionValues {
  position1 = 0,
  position2 = 1,
  position3 = 2,
  position4 = 3,
  position5 = 4,
}
export class CreateSongsLyricDto {
  @IsNumber()
  @IsNotEmpty()
  structureId: number;

  @IsString()
  @IsNotEmpty()
  lyrics: string;

  @IsEnum(positionValues)
  position: positionValues;
}
