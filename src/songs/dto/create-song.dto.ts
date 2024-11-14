import {
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

enum Key {
  C = 'C',
  Cm = 'Cm',
  'C#' = 'C#',
  'C#m' = 'C#m',
  D = 'D',
  Dm = 'Dm',
  'D#' = 'D#',
  'D#m' = 'D#m',
  E = 'E',
  Em = 'Em',
  F = 'F',
  Fm = 'Fm',
  'F#' = 'F#',
  'F#m' = 'F#m',
  G = 'G',
  Gm = 'Gm',
  'G#' = 'G#',
  'G#m' = 'G#m',
  A = 'A',
  Am = 'Am',
  'A#' = 'A#',
  'A#m' = 'A#m',
  B = 'B',
  Bm = 'Bm',
}
export class CreateSongDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  artist: string;

  @IsEnum(SongType)
  songType: SongType;

  @IsString()
  @IsOptional()
  youtubeLink: string;

  @IsEnum(Key)
  key: Key;

  @IsNumber()
  @IsOptional()
  tempo: number;
}
