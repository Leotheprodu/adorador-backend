import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
enum SongType {
  WORSHIP = 'worship',
  PRAISE = 'praise',
}
export class CreateSongDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  artist: string;

  @IsNumber()
  @IsNotEmpty()
  churchId: number;

  @IsEnum(SongType)
  songType: SongType;

  @IsString()
  @IsOptional()
  youtubeLink: string;

  @IsString()
  @IsOptional()
  key: string;

  @IsString()
  @IsOptional()
  tempo: string;
}
