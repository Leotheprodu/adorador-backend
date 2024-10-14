import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSongsLyricDto {
  @IsNumber()
  @IsNotEmpty()
  structureId: number;

  @IsString()
  @IsNotEmpty()
  lyrics: string;

  @IsNumber()
  @IsNotEmpty()
  position: number;
}
